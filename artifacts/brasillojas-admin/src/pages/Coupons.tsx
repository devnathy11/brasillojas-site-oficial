import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useListCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from "@workspace/api-client-react";
import type { Coupon, CreateCouponBody } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

const emptyForm: CreateCouponBody = {
  code: "",
  discountType: "percentage",
  discountValue: 10,
  minOrderAmount: undefined,
  maxUses: undefined,
  expiresAt: undefined,
  isActive: true,
};

export default function CouponsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CreateCouponBody>(emptyForm);

  const { data: coupons, isLoading } = useListCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const queryClient = useQueryClient();

  function openCreate() {
    setEditCoupon(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(coupon: Coupon) {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount ?? undefined,
      maxUses: coupon.maxUses ?? undefined,
      expiresAt: coupon.expiresAt ?? undefined,
      isActive: coupon.isActive,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editCoupon) {
      updateCoupon.mutate({ id: editCoupon.id, data: form }, {
        onSuccess: () => { queryClient.invalidateQueries(); setShowForm(false); },
      });
    } else {
      createCoupon.mutate({ data: form }, {
        onSuccess: () => { queryClient.invalidateQueries(); setShowForm(false); },
      });
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Excluir este cupom?")) return;
    deleteCoupon.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries() });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cupons de Desconto</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} /> Novo Cupom
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : !coupons?.length ? (
          <div className="p-16 text-center">
            <Tag size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum cupom criado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Codigo</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Desconto</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Uso</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Expira em</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-sm text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : `R$ ${coupon.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {coupon.usedCount} / {coupon.maxUses ?? "ilimitado"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Sem expiracao"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {coupon.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="p-1.5 text-gray-500 hover:text-[#1B5E20] hover:bg-green-50 rounded transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-5">{editCoupon ? "Editar Cupom" : "Novo Cupom"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Codigo do Cupom</label>
                    <input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      required
                      placeholder="ex: PROMO10"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase outline-none focus:border-[#1B5E20]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Desconto</label>
                      <select
                        value={form.discountType}
                        onChange={(e) => setForm({ ...form, discountType: e.target.value as "percentage" | "fixed" })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                      >
                        <option value="percentage">Porcentagem (%)</option>
                        <option value="fixed">Valor Fixo (R$)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Valor</label>
                      <input
                        type="number"
                        value={form.discountValue}
                        onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                        required
                        min={0}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Maximo de Usos</label>
                      <input
                        type="number"
                        value={form.maxUses ?? ""}
                        onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Ilimitado"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Expiracao</label>
                      <input
                        type="date"
                        value={form.expiresAt ?? ""}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value || undefined })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Cupom ativo</span>
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={createCoupon.isPending || updateCoupon.isPending}
                      className="flex-1 py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-semibold rounded-lg transition-colors disabled:opacity-70"
                    >
                      {editCoupon ? "Salvar" : "Criar Cupom"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
