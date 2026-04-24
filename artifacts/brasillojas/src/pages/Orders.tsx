import { Link } from "wouter";
import { motion } from "framer-motion";
import { Package, ChevronRight, CheckCircle2, Circle, Truck, ShoppingBag, PackageCheck, Clock } from "lucide-react";
import { useListOrders } from "@workspace/api-client-react";
import type { Order } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL, formatDate } from "@/lib/utils";

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

const statusLabel: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  criando: "Criando seu produto",
  processando: "Em processamento",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  criando: "bg-orange-100 text-orange-800",
  processando: "bg-purple-100 text-purple-800",
  saiu_para_entrega: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
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

function OrderTracker({ status }: { status: string }) {
  const currentIndex = STEP_INDEX[status] ?? -1;
  if (currentIndex === -1) return null;

  return (
    <div className="mt-4 mb-1">
      <div className="flex items-start justify-between gap-1">
        {TRACKING_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center flex-1 min-w-0">
              <div className="relative flex items-center w-full">
                {i > 0 && (
                  <div
                    className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 ${done || active ? "bg-[#1B5E20]" : "bg-gray-200"}`}
                  />
                )}
                {i < TRACKING_STEPS.length - 1 && (
                  <div
                    className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 ${done ? "bg-[#1B5E20]" : "bg-gray-200"}`}
                  />
                )}
                <div className="relative z-10 mx-auto">
                  {done ? (
                    <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-white" />
                    </div>
                  ) : active ? (
                    <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center ring-4 ring-green-100">
                      <Icon size={14} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <Icon size={14} className="text-gray-400" />
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

function isTrackedStatus(status: string) {
  return status in STEP_INDEX;
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

                {isTrackedStatus(order.status) && (
                  <OrderTracker status={order.status} />
                )}

                <div className="flex gap-2 mt-3 mb-3 overflow-x-auto">
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
                  <Link href={`/orders/${order.id}`} className="flex items-center gap-1 text-[#1B5E20] text-sm font-medium hover:underline">
                    {order.status === "saiu_para_entrega" ? "Confirmar entrega" : "Ver detalhes"} <ChevronRight size={14} />
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
