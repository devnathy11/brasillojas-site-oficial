import { useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Printer, CheckCircle2, ArrowLeft, QrCode } from "lucide-react";
import { useGetOrder } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import logo from "@/assets/logo.jpg";
import { formatBRL } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  boleto: "Boleto Bancário",
};

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const [location] = useLocation();
  const orderId = Number(params.id);
  const { data: order, isLoading } = useGetOrder(orderId, { query: { enabled: !!orderId } });

  // Auto-print if ?print=1 is set
  useEffect(() => {
    if (!order || isLoading) return;
    if (location.includes("print=1") || window.location.search.includes("print=1")) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [order, isLoading, location]);

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
  const fakePixCode = `00020126580014BR.GOV.BCB.PIX0136brasillojas-${order.id}-${Date.now().toString(36)}5204000053039865802BR5910BRASILLOJAS6009SAO PAULO62070503***6304ABCD`;
  const fakeBoleto = `34191.79001 01043.510047 91020.150008 1 ${String(Date.now()).slice(-14)}`;

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

        {/* Receipt */}
        <div className="bg-white rounded-lg shadow print:shadow-none print:rounded-none border border-gray-200 print:border-0 p-6 print:p-4 font-mono text-sm receipt">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <img src={logo} alt="BrasilLojas" className="h-14 mx-auto mb-2 object-contain" />
            <h1 className="font-bold text-base">BRASILLOJAS COMÉRCIO LTDA</h1>
            <p className="text-xs text-gray-600">CNPJ: 12.345.678/0001-90</p>
            <p className="text-xs text-gray-600">Av. Paulista, 1000 - São Paulo/SP</p>
            <p className="text-xs text-gray-600">www.brasillojas.com.br</p>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-2 justify-center mb-4 font-bold ${paid ? "text-green-700" : "text-yellow-700"}`}>
            <CheckCircle2 size={18} />
            {paid ? "PAGAMENTO APROVADO" : "AGUARDANDO PAGAMENTO"}
          </div>

          {/* Meta */}
          <div className="mb-4 space-y-1 text-xs">
            <div className="flex justify-between"><span>Protocolo:</span><span className="font-bold">{protocolo}</span></div>
            <div className="flex justify-between"><span>Data:</span><span>{date.toLocaleString("pt-BR")}</span></div>
            <div className="flex justify-between"><span>Pagamento:</span><span className="font-bold">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span></div>
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
            <p>{order.shippingAddress.street}, {order.shippingAddress.number}</p>
            {order.shippingAddress.complement && <p>{order.shippingAddress.complement}</p>}
            <p>{order.shippingAddress.neighborhood}</p>
            <p>{order.shippingAddress.city}/{order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
          </div>

          {/* Payment-specific block */}
          {order.paymentMethod === "pix" && order.paymentStatus !== "paid" && (
            <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3 text-xs">
              <p className="font-bold mb-2 flex items-center gap-1"><QrCode size={14} /> CÓDIGO PIX COPIA E COLA</p>
              <div className="bg-gray-50 border border-gray-300 p-2 break-all text-[10px] font-mono">{fakePixCode}</div>
              <p className="mt-2 text-center">Vencimento: 30 minutos</p>
            </div>
          )}
          {order.paymentMethod === "boleto" && (
            <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3 text-xs">
              <p className="font-bold mb-2">LINHA DIGITÁVEL</p>
              <div className="bg-gray-50 border border-gray-300 p-2 break-all text-[11px] font-mono text-center tracking-wider">{fakeBoleto}</div>
              <p className="mt-2 text-center">Vencimento: 3 dias úteis</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-4 text-center text-xs text-gray-600">
            <p className="font-bold">OBRIGADO PELA SUA COMPRA!</p>
            <p>Acompanhe seu pedido em www.brasillojas.com.br/orders</p>
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
