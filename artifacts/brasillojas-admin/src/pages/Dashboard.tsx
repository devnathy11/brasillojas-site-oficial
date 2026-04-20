import { motion } from "framer-motion";
import { Package, ShoppingBag, DollarSign, AlertTriangle, Tag, Users } from "lucide-react";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { formatBRL } from "@/lib/utils";

function StatCard({ title, value, icon: Icon, color, subtitle }: {
  title: string;
  value: string | number;
  icon: typeof Package;
  color: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-800">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Total de Produtos", value: stats?.products?.total ?? 0, icon: Package, color: "bg-[#1B5E20]", subtitle: `${stats?.products?.active ?? 0} ativos` },
    { title: "Estoque Baixo", value: stats?.products?.lowStock ?? 0, icon: AlertTriangle, color: "bg-[#F57F17]", subtitle: "Menos de 10 unidades" },
    { title: "Total de Pedidos", value: stats?.orders?.total ?? 0, icon: ShoppingBag, color: "bg-blue-600", subtitle: `${stats?.orders?.pending ?? 0} pendentes` },
    { title: "Pedidos Entregues", value: stats?.orders?.delivered ?? 0, icon: ShoppingBag, color: "bg-green-600", subtitle: "Finalizados" },
    { title: "Faturamento Total", value: formatBRL(stats?.revenue?.total), icon: DollarSign, color: "bg-[#C62828]", subtitle: "Todos os pedidos" },
    { title: "Cupons Ativos", value: stats?.coupons?.active ?? 0, icon: Tag, color: "bg-purple-600", subtitle: `${stats?.coupons?.total ?? 0} total` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
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

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Atividade Recente</h2>
        <p className="text-gray-500 text-sm">Dados de atividade recente aparecerão aqui.</p>
      </div>
    </div>
  );
}
