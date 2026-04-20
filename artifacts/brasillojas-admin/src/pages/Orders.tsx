import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useListAllOrders } from "@workspace/api-client-react";
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

export default function OrdersPage() {
  const { data: orders, isLoading } = useListAllOrders();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pedidos</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : !orders?.length ? (
          <div className="p-16 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum pedido ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Pedido</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Data</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Itens</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">#{order.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.items.length} item(s)</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatBRL(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
