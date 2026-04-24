import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { useGetOrder } from "@workspace/api-client-react";
import { CheckCircle2, Clock, XCircle, Package, MapPin, CreditCard, Copy, Check, QrCode, FileText } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL, formatDate } from "@/lib/utils";
import { Link } from "wouter";
import QRCode from "qrcode";

const paymentLabel: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  boleto: "Boleto Bancário",
};

function genPixCode(orderId: number, total: number): string {
  const val = total.toFixed(2);
  const desc = `BrasilLojas Pedido ${orderId}`;
  const key = "moveis@grupobrasillojas.com";
  return `00020126580014BR.GOV.BCB.PIX0136${key}0213${desc}5204000053039865406${val}5802BR5910BRASILLOJAS6009PINHEIRO62070503***6304CAFE`;
}

function genBoletoCode(orderId: number): string {
  const pad = String(orderId).padStart(8, "0");
  return `34191.79001 01043.510047 91020.${pad} 1 ${String(Date.now()).slice(-14)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1B5E20] hover:bg-[#2E7D32] text-white transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}

function PixPaymentSection({ orderId, total }: { orderId: number; total: number }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const pixCode = genPixCode(orderId, total);

  useEffect(() => {
    QRCode.toDataURL(pixCode, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => {});
  }, [pixCode]);

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <QrCode size={20} className="text-green-700" />
        <h3 className="font-bold text-green-900">Pague com PIX</h3>
      </div>
      <div className="flex flex-col items-center gap-4">
        {qrDataUrl ? (
          <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
            <img src={qrDataUrl} alt="QR Code PIX" className="w-48 h-48" />
          </div>
        ) : (
          <div className="w-48 h-48 bg-white rounded-lg border border-green-200 flex items-center justify-center">
            <QrCode size={64} className="text-gray-300" />
          </div>
        )}
        <p className="text-sm text-green-800 text-center font-medium">Escaneie o QR Code no seu app bancário</p>
        <div className="w-full">
          <p className="text-xs text-green-700 font-semibold mb-2">PIX Copia e Cola:</p>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-green-200 p-2">
            <p className="text-[10px] text-gray-600 break-all flex-1 leading-relaxed">{pixCode}</p>
            <CopyButton text={pixCode} />
          </div>
        </div>
        <p className="text-xs text-green-700 text-center">⏱ Vencimento: 30 minutos após a confirmação do pedido</p>
      </div>
    </div>
  );
}

function BoletoPaymentSection({ orderId }: { orderId: number }) {
  const boletoCode = genBoletoCode(orderId);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-yellow-700" />
        <h3 className="font-bold text-yellow-900">Boleto Bancário</h3>
      </div>
      <div className="space-y-3">
        <div className="bg-white rounded-lg border border-yellow-200 p-3">
          <p className="text-xs text-yellow-700 font-semibold mb-2">Código de Barras:</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-center py-2">
              <svg viewBox="0 0 200 60" className="w-full max-w-xs h-14" aria-label="Código de barras">
                {Array.from({ length: 60 }).map((_, i) => (
                  <rect
                    key={i}
                    x={i * 3.2 + 4}
                    y={0}
                    width={i % 3 === 0 ? 3 : i % 5 === 0 ? 1 : 2}
                    height={60}
                    fill="black"
                  />
                ))}
              </svg>
            </div>
            <p className="text-center text-xs font-mono text-gray-700 tracking-wider">{boletoCode}</p>
            <div className="flex justify-center">
              <CopyButton text={boletoCode} />
            </div>
          </div>
        </div>
        <p className="text-xs text-yellow-800 text-center">⏱ Vencimento: 3 dias úteis · Pague em qualquer banco ou lotérica</p>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <CheckCircle2 size={40} className="text-green-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-green-800 text-lg">Pagamento Concluído</p>
          <p className="text-green-700 text-sm">Seu pagamento foi confirmado com sucesso.</p>
        </div>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <Clock size={40} className="text-yellow-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-yellow-800 text-lg">Aguardando Pagamento</p>
          <p className="text-yellow-700 text-sm">Seu pedido foi criado. Realize o pagamento para confirmar.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
      <XCircle size={40} className="text-red-600 flex-shrink-0" />
      <div>
        <p className="font-bold text-red-800 text-lg">Pagamento não confirmado</p>
        <p className="text-red-700 text-sm">Status: {status}</p>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id ?? "0");
  const { data: order, isLoading } = useGetOrder(orderId, { query: { enabled: !!orderId } as any });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="skeleton h-16 rounded mb-4 mx-auto w-64" />
          <div className="skeleton h-8 rounded mb-2" />
          <div className="skeleton h-8 rounded w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-700 mb-4">Pedido não encontrado</h1>
          <Link href="/orders" className="text-[#1B5E20] hover:underline">Ver meus pedidos</Link>
        </div>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const isPix = order.paymentMethod === "pix";
  const isBoleto = order.paymentMethod === "boleto";
  const needsPayment = order.paymentStatus !== "paid";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pedido #{order.id} Confirmado!</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(order.createdAt)}</p>
        </div>

        <div className="space-y-4">
          {/* Payment status */}
          <PaymentStatusBadge status={order.paymentStatus ?? "pending"} />

          {/* PIX payment section */}
          {isPix && needsPayment && (
            <PixPaymentSection orderId={order.id} total={order.total} />
          )}

          {/* Boleto payment section */}
          {isBoleto && needsPayment && (
            <BoletoPaymentSection orderId={order.id} />
          )}

          {/* Order items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-[#1B5E20]" />
              <h2 className="font-bold text-gray-800">Itens do Pedido</h2>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded border border-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity}x {formatBRL(item.price)}</p>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{formatBRL(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-1">
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Desconto</span>
                  <span>-{formatBRL(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-[#C62828]">{formatBRL(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} className="text-[#1B5E20]" />
              <h2 className="font-bold text-gray-800">Forma de Pagamento</h2>
            </div>
            <p className="text-gray-600 text-sm">
              {order.paymentMethod ? (paymentLabel[order.paymentMethod] ?? order.paymentMethod) : "—"}
            </p>
          </div>

          {/* Delivery address */}
          {addr && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} className="text-[#1B5E20]" />
                <h2 className="font-bold text-gray-800">Endereço de Entrega</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {addr.street}, {addr.number}{addr.complement ? `, ${addr.complement}` : ""}<br />
                {addr.neighborhood} — {addr.city}/{addr.state}<br />
                CEP: {addr.zipCode}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/orders"
            className="flex-1 text-center py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-md transition-colors"
          >
            Meus Pedidos
          </Link>
          <Link
            href="/products"
            className="flex-1 text-center py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-md transition-colors"
          >
            Continuar Comprando
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
