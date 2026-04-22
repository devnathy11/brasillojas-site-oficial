import { motion } from "framer-motion";
import { Package, ShoppingBag, DollarSign, AlertTriangle, Tag, TrendingUp, Calendar } from "lucide-react";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { formatBRL } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const PAYMENT_LABEL: Record<string, string> = {
  pix: "PIX",
  credit_card: "Crédito",
  debit_card: "Débito",
  boleto: "Boleto",
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="skeleton h-28 rounded-xl" />))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Faturamento Total", value: formatBRL(stats?.revenue?.total ?? 0), icon: DollarSign, color: "bg-[#C62828]", subtitle: "Todos os pedidos" },
    { title: "Faturamento (7 dias)", value: formatBRL(stats?.revenue?.week ?? 0), icon: TrendingUp, color: "bg-[#1B5E20]", subtitle: "Última semana" },
    { title: "Faturamento Hoje", value: formatBRL(stats?.revenue?.today ?? 0), icon: Calendar, color: "bg-emerald-600", subtitle: "Últimas 24h" },
    { title: "Total de Pedidos", value: stats?.orders?.total ?? 0, icon: ShoppingBag, color: "bg-blue-600", subtitle: `${stats?.orders?.pending ?? 0} pendentes` },
    { title: "Total de Produtos", value: stats?.products?.total ?? 0, icon: Package, color: "bg-indigo-600", subtitle: `${stats?.products?.active ?? 0} ativos` },
    { title: "Estoque Baixo", value: stats?.products?.lowStock ?? 0, icon: AlertTriangle, color: "bg-[#F57F17]", subtitle: "Menos de 10 unidades" },
    { title: "Cupons Ativos", value: stats?.coupons?.active ?? 0, icon: Tag, color: "bg-purple-600", subtitle: `${stats?.coupons?.total ?? 0} no total` },
  ];

  const sales = stats?.salesByDay ?? [];
  const maxSales = Math.max(1, ...sales.map((s) => s.total));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-800">{card.value}</p>
              {card.subtitle && <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Vendas dos Últimos 7 Dias</h2>
          {sales.length === 0 ? (
            <p className="text-gray-500 text-sm">Sem vendas no período.</p>
          ) : (
            <div className="flex items-end gap-3 h-56 border-b border-gray-200 pb-2">
              {sales.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-bold text-gray-700">{formatBRL(s.total)}</div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(s.total / maxSales) * 180}px` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-[#1B5E20] to-[#4CAF50] rounded-t-md min-h-[4px]"
                    title={`${s.orders} pedidos · ${formatBRL(s.total)}`}
                  />
                  <div className="text-xs text-gray-500">{s.day}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent orders */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Pedidos Recentes</h2>
          {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum pedido ainda.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.recentOrders.map((o) => (
                <div key={o.id} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800">#{o.id}</p>
                    <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-700"}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#1B5E20]">{formatBRL(o.total)}</p>
                    <p className="text-xs text-gray-500">{o.itemCount} {o.itemCount === 1 ? "item" : "itens"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
