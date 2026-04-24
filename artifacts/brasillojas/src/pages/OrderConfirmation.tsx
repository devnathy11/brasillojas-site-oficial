import { useParams, useLocation } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { CheckCircle2, Clock, XCircle, Package, MapPin, CreditCard } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL, formatDate } from "@/lib/utils";
import { Link } from "wouter";

const paymentLabel: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  boleto: "Boleto Bancário",
};

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
          <p className="text-yellow-700 text-sm">Seu pedido foi criado. Aguardando confirmação do pagamento.</p>
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
  const { data: order, isLoading } = useGetOrder(orderId, { query: { enabled: !!orderId } });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pedido #{order.id}</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(order.createdAt)}</p>
        </div>

        <div className="space-y-4">
          {/* Payment status */}
          <PaymentStatusBadge status={order.paymentStatus ?? "pending"} />

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
