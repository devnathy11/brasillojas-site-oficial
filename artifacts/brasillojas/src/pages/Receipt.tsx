import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Printer, CheckCircle2, ArrowLeft, QrCode, Truck, PackageCheck, ShoppingBag, Package, Copy, Check } from "lucide-react";
import { useGetOrder, useConfirmDelivery } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Header } from "@/components/Header";
import logo from "@/assets/logo.jpg";
import { formatBRL } from "@/lib/utils";
import QRCode from "qrcode";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  dinheiro: "Dinheiro",
  cartao: "Cartão na Loja",
};

const STATUS_LABELS: Record<string, string> = {
  criando: "Criando seu produto",
  processando: "Em processamento",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  pending: "Aguardando pagamento",
  confirmed: "Confirmado",
};

const TRACKING_STEPS = [
  { key: "criando", label: "Criando seu produto", icon: ShoppingBag },
  { key: "processando", label: "Em processamento", icon: Package },
  { key: "saiu_para_entrega", label: "Saiu para entrega", icon: Truck },
  { key: "entregue", label: "Entregue", icon: PackageCheck },
];

const STEP_INDEX: Record<string, number> = {
  criando: 0,
  processando: 1,
  saiu_para_entrega: 2,
  entregue: 3,
};

function OrderTracker({ status }: { status: string }) {
  const currentIndex = STEP_INDEX[status] ?? -1;
  if (currentIndex === -1) return null;

  return (
    <div className="mt-2 mb-4">
      <p className="text-xs font-semibold text-gray-600 mb-3">Rastreamento do pedido</p>
      <div className="flex items-start justify-between gap-1">
        {TRACKING_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center flex-1 min-w-0">
              <div className="relative flex items-center w-full">
                {i > 0 && (
                  <div className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 ${done || active ? "bg-[#1B5E20]" : "bg-gray-200"}`} />
                )}
                {i < TRACKING_STEPS.length - 1 && (
                  <div className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 ${done ? "bg-[#1B5E20]" : "bg-gray-200"}`} />
                )}
                <div className="relative z-10 mx-auto">
                  {done ? (
                    <div className="w-7 h-7 rounded-full bg-[#1B5E20] flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  ) : active ? (
                    <div className="w-7 h-7 rounded-full bg-[#1B5E20] flex items-center justify-center ring-4 ring-green-100">
                      <Icon size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <Icon size={12} className="text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              <p className={`text-[10px] text-center mt-1.5 leading-tight px-0.5 ${active ? "font-bold text-[#1B5E20]" : done ? "text-gray-600" : "text-gray-400"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STORE = {
  name: "BRASILLOJAS COMÉRCIO LTDA",
  cnpj: "05.279.846/0001-26",
  address: "Av. Getúlio Vargas, 1010 A — Centro",
  city: "Pinheiro-MA",
  cep: "CEP: 65.200-000",
  phone: "(98) 3381-4556",
  site: "www.brasillojas.com.br",
  hours: "Seg–Sex: 8h às 18h | Sáb: 8h às 12h",
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="no-print inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-[#1B5E20] text-white rounded"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const { data: order, isLoading } = useGetOrder(orderId, { query: { enabled: !!orderId } as any });
  const { user } = useUser();
  const customerName = user?.fullName ?? user?.firstName ?? null;
  const queryClient = useQueryClient();

  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [pixQrUrl, setPixQrUrl] = useState<string>("");
  const { mutate: doConfirmDelivery, isPending: isConfirming } = useConfirmDelivery();

  useEffect(() => {
    if (!order || isLoading) return;
    const key = "bl_autoprint_order";
    const pending = sessionStorage.getItem(key);
    if (pending === String(orderId)) {
      sessionStorage.removeItem(key);
      const t = setTimeout(() => window.print(), 700);
      return () => clearTimeout(t);
    }
    return;
  }, [order, isLoading, orderId]);

  useEffect(() => {
    if (!order || order.paymentMethod !== "pix" || order.paymentStatus === "paid") return;
    const code = `00020126580014BR.GOV.BCB.PIX0130moveis@grupobrasillojas.com0217Pedido ${order.id}5204000053039865406${order.total.toFixed(2)}5802BR5910BRASILLOJAS6007PINHEIR62070503***6304CAFE`;
    QRCode.toDataURL(code, { width: 200, margin: 1 }).then(setPixQrUrl).catch(() => {});
  }, [order]);

  function handleConfirmDelivery() {
    setConfirmError(null);
    doConfirmDelivery(
      { id: orderId },
      {
        onSuccess: () => {
          setConfirmed(true);
          queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        },
        onError: (err: unknown) => {
          setConfirmError(err instanceof Error ? err.message : "Não foi possível confirmar a entrega. Tente novamente.");
        },
      }
    );
  }

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">Carregando comprovante...</div>
      </div>
    );
  }

  const date = new Date(order.createdAt);
  const protocolo = `BL-${String(order.id).padStart(8, "0")}`;
  const paid = order.paymentStatus === "paid";
  const pixCode = `00020126580014BR.GOV.BCB.PIX0130moveis@grupobrasillojas.com0217Pedido ${order.id}5204000053039865406${order.total.toFixed(2)}5802BR5910BRASILLOJAS6007PINHEIR62070503***6304CAFE`;
  const isDeliveryPending = order.status === "saiu_para_entrega" && !confirmed;
  const isDelivered = order.status === "entregue" || confirmed;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="no-print">
        <Header />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 print:p-0 print:max-w-full">
        {/* Action bar - hidden on print */}
        <div className="no-print flex items-center justify-between mb-4">
          <Link href="/orders" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B5E20]">
            <ArrowLeft size={16} /> Meus pedidos
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-4 py-2 rounded font-semibold text-sm"
          >
            <Printer size={16} /> Imprimir comprovante
          </button>
        </div>

        {/* Order Status Tracker */}
        {STEP_INDEX[order.status] !== undefined && (
          <div className="no-print bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <OrderTracker status={confirmed ? "entregue" : order.status} />
          </div>
        )}

        {/* Confirm Delivery Banner */}
        {isDeliveryPending && (
          <div className="no-print mb-4 bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <Truck size={24} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-blue-900">Seu pedido chegou?</p>
                <p className="text-sm text-blue-700">Confirme o recebimento para finalizar seu pedido.</p>
              </div>
            </div>
            {confirmError && (
              <p className="text-sm text-red-600 mb-3">{confirmError}</p>
            )}
            <button
              onClick={handleConfirmDelivery}
              disabled={isConfirming}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <PackageCheck size={18} />
              {isConfirming ? "Confirmando..." : "Confirmar Recebimento"}
            </button>
          </div>
        )}

        {/* Thank-you confirmation */}
        {isDelivered && (
          <div className="no-print mb-4 bg-green-50 border border-green-200 rounded-lg p-5 flex items-center gap-3">
            <CheckCircle2 size={28} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-900">Entrega confirmada!</p>
              <p className="text-sm text-green-700">Obrigado por comprar na BrasilLojas. Esperamos te ver novamente!</p>
            </div>
          </div>
        )}

        {/* Receipt */}
        <div className="bg-white rounded-lg shadow print:shadow-none print:rounded-none border border-gray-200 print:border-0 p-6 print:p-4 font-mono text-sm receipt">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <img src={logo} alt="BrasilLojas" className="h-14 mx-auto mb-2 object-contain" />
            <h1 className="font-bold text-base">{STORE.name}</h1>
            <p className="text-xs text-gray-600">CNPJ: {STORE.cnpj}</p>
            <p className="text-xs text-gray-600">{STORE.address}</p>
            <p className="text-xs text-gray-600">{STORE.city} · {STORE.cep}</p>
            <p className="text-xs text-gray-600">Tel: {STORE.phone}</p>
            <p className="text-xs text-gray-600">{STORE.site}</p>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-2 justify-center mb-4 font-bold ${paid ? "text-green-700" : "text-yellow-700"}`}>
            <CheckCircle2 size={18} />
            {paid ? "PAGAMENTO APROVADO" : "AGUARDANDO PAGAMENTO"}
          </div>

          {/* Order status */}
          {STATUS_LABELS[order.status] && (
            <div className="flex items-center gap-2 justify-center mb-4 text-xs text-gray-600">
              <span className="font-semibold">Status do pedido:</span>
              <span>{STATUS_LABELS[order.status] ?? order.status}</span>
            </div>
          )}

          {/* Meta */}
          <div className="mb-4 space-y-1 text-xs">
            <div className="flex justify-between"><span>Protocolo:</span><span className="font-bold">{protocolo}</span></div>
            <div className="flex justify-between"><span>Data:</span><span>{date.toLocaleString("pt-BR")}</span></div>
            <div className="flex justify-between"><span>Pagamento:</span><span className="font-bold">{PAYMENT_LABELS[order.paymentMethod as keyof typeof PAYMENT_LABELS] ?? order.paymentMethod}</span></div>
            {order.couponCode && <div className="flex justify-between"><span>Cupom:</span><span>{order.couponCode}</span></div>}
          </div>

          <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3">
            <p className="font-bold text-xs mb-2">ITENS</p>
            {order.items.map((it, i) => (
              <div key={i} className="mb-2 text-xs">
                <p className="font-medium uppercase">{it.name}</p>
                <div className="flex justify-between text-gray-600">
                  <span>{it.quantity}x {formatBRL(it.price)}</span>
                  <span className="font-bold text-gray-800">{formatBRL(it.price * it.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-1 text-xs">
            <div className="flex justify-between"><span>Subtotal:</span><span>{formatBRL(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Desconto:</span><span>-{formatBRL(order.discount)}</span></div>}
            <div className="flex justify-between"><span>Frete:</span><span>GRÁTIS</span></div>
            <div className="flex justify-between text-base font-bold border-t border-gray-400 pt-2 mt-2">
              <span>TOTAL:</span>
              <span>{formatBRL(order.total)}</span>
            </div>
          </div>

          {/* Address */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3 text-xs">
            <p className="font-bold mb-1">ENTREGA</p>
            {customerName && <p className="font-semibold">{customerName}</p>}
            <p>{order.shippingAddress.street}, {order.shippingAddress.number}</p>
            {order.shippingAddress.complement && <p>{order.shippingAddress.complement}</p>}
            <p>{order.shippingAddress.neighborhood}</p>
            <p>{order.shippingAddress.city}/{order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
          </div>

          {/* Loja info */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3 text-xs">
            <p className="font-bold mb-1">LOJA FÍSICA / RETIRADA</p>
            <p>{STORE.address}</p>
            <p>{STORE.city} · {STORE.cep}</p>
            <p>Tel: {STORE.phone}</p>
            <p>Horário: {STORE.hours}</p>
            <p className="mt-1 text-gray-600">CNPJ: {STORE.cnpj}</p>
          </div>

          {/* Payment-specific block */}
          {order.paymentMethod === "pix" && order.paymentStatus !== "paid" && (
            <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3 text-xs">
              <p className="font-bold mb-2 flex items-center gap-1"><QrCode size={14} /> PAGAMENTO VIA PIX</p>
              {pixQrUrl && (
                <div className="flex justify-center my-3">
                  <img src={pixQrUrl} alt="QR Code PIX" className="w-36 h-36 border border-gray-300" />
                </div>
              )}
              <p className="font-semibold mb-1">PIX Copia e Cola:</p>
              <div className="bg-gray-50 border border-gray-300 p-2 break-all text-[10px] font-mono">{pixCode}</div>
              <div className="flex justify-center mt-2"><CopyBtn text={pixCode} /></div>
              <p className="mt-2 text-center text-gray-500">Vencimento: 30 minutos após o pedido</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-4 text-center text-xs text-gray-600">
            <p className="font-bold">OBRIGADO PELA SUA COMPRA!</p>
            <p>Acompanhe seu pedido em {STORE.site}/orders</p>
            <p className="mt-1">{STORE.name} · CNPJ: {STORE.cnpj}</p>
            <p className="mt-2">**** FIM DO COMPROVANTE ****</p>
          </div>
        </div>
      </main>

      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .receipt { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
