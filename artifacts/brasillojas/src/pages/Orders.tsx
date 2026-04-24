import { Link } from "wouter";
import { motion } from "framer-motion";
import { Package, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { useListOrders } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL, formatDate } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function PaymentStatusBadge({ status }: { status?: string | null }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        <CheckCircle2 size={11} /> Pagamento Concluído
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
      <Clock size={11} /> Aguardando Pagamento
    </span>
  );
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useListOrders();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Meus Pedidos</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-lg" />
            ))}
          </div>
        ) : !orders?.length ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Nenhum pedido ainda</h2>
            <p className="text-gray-500 mb-6">Seus pedidos aparecerão aqui</p>
            <Link
              href="/products"
              className="inline-block bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold px-8 py-3 rounded-md transition-colors"
            >
              Começar a Comprar
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">Pedido #{order.id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {statusLabel[order.status] ?? order.status}
                  </span>
                </div>

                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {order.items.slice(0, 3).map((item) => (
                    <img key={item.productId} src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded border border-gray-100 flex-shrink-0" />
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-12 h-12 rounded border border-gray-100 bg-gray-50 flex items-center justify-center text-xs text-gray-500 font-medium">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{order.items.length} {order.items.length === 1 ? "item" : "itens"}</p>
                    <p className="font-bold text-[#1B5E20]">{formatBRL(order.total)}</p>
                    <div className="mt-1">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>
                  <Link href={`/order-confirmation/${order.id}`} className="flex items-center gap-1 text-[#1B5E20] text-sm font-medium hover:underline">
                    Ver pedido <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
