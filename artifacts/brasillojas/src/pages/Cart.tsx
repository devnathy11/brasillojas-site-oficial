import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Minus,
  Plus,
  Tag,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Truck,
  Store,
} from "lucide-react";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useValidateCoupon,
  useGetUserProfile,
  useGetSettingsPixDiscount,
} from "@workspace/api-client-react";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { Show } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL } from "@/lib/utils";

function isProfileComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return !!(profile.name && profile.email && profile.phone);
}

export default function CartPage() {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [pendingItems, setPendingItems] = useState<Set<number>>(new Set());

  const { data: cart, isLoading } = useGetCart({
    query: { retry: false } as any,
  });
  const { data: profile } = useGetUserProfile({
    query: { retry: false } as any,
  });
  const { data: pixSetting } = useGetSettingsPixDiscount();

  // Garante que o percent do PIX venha estritamente numérico e trate o 0 perfeitamente
  const pixDiscountPercent =
    pixSetting?.percent !== undefined && pixSetting?.percent !== null
      ? Number(pixSetting.percent)
      : 0;

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const queryClient = useQueryClient();

  const { data: couponData, refetch: validateCoupon } = useValidateCoupon(
    appliedCoupon,
    {
      query: { enabled: !!appliedCoupon, retry: false } as any,
    },
  );

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim().toUpperCase());
    validateCoupon().then((res) => {
      if (res.data?.valid === false) {
        setCouponError(res.data?.message ?? "Cupom inválido");
        setAppliedCoupon("");
      } else {
        setCouponError("");
      }
    });
  }

  function handleQtyChange(productId: number, qty: number) {
    setPendingItems((prev) => new Set(prev).add(productId));
    const done = () => {
      setPendingItems((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
    };
    if (qty < 1) {
      removeItem.mutate({ productId }, { onSuccess: done, onError: done });
    } else {
      updateItem.mutate(
        { productId, data: { quantity: qty } },
        { onSuccess: done, onError: done },
      );
    }
  }

  function handleRemove(productId: number) {
    setPendingItems((prev) => new Set(prev).add(productId));
    const done = () => {
      setPendingItems((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
    };
    removeItem.mutate({ productId }, { onSuccess: done, onError: done });
  }

  function toggleSelectItem(productId: number) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function toggleSelectGroup(productIds: number[]) {
    setSelectedItems((prev) => {
      const allSelected = productIds.every((id) => prev.has(id));
      const next = new Set(prev);
      productIds.forEach((id) =>
        allSelected ? next.delete(id) : next.add(id),
      );
      return next;
    });
  }

  function toggleSelectAll(allIds: number[]) {
    setSelectedItems((prev) => {
      if (allIds.every((id) => prev.has(id))) return new Set();
      return new Set(allIds);
    });
  }

  function handleRemoveSelected() {
    selectedItems.forEach((productId) => {
      removeItem.mutate({ productId });
    });
    setSelectedItems(new Set());
    setTimeout(
      () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
      300,
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="skeleton h-8 rounded w-1/2 mx-auto mb-4" />
          <div className="skeleton h-32 rounded mb-4" />
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const DELIVERY_SLUGS = ["moveis", "eletronicos"];
  const moveiItems = items.filter((i) =>
    DELIVERY_SLUGS.includes(i.categorySlug ?? ""),
  );
  const nonMoveiItems = items.filter(
    (i) => !DELIVERY_SLUGS.includes(i.categorySlug ?? ""),
  );
  const isEmpty = items.length === 0;
  const subtotal = Number(cart?.subtotal ?? 0);
  const couponDiscount =
    couponData?.valid && couponData.coupon
      ? couponData.coupon.discountType === "percentage"
        ? subtotal * (Number(couponData.coupon.discountValue) / 100)
        : Number(couponData.coupon.discountValue)
      : 0;
  const discount = Number(cart?.discount ?? 0) + couponDiscount;
  const total = Math.max(0, subtotal - discount);
  const profileComplete = isProfileComplete(profile);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Carrinho de Compras
        </h1>

        {isEmpty ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-16 text-center">
            <ShoppingBag size={56} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-500 mb-6">
              Adicione produtos para continuar comprando
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold px-8 py-3 rounded-md transition-colors"
            >
              Explorar Produtos <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {/* Select all bar */}
              {items.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={items.every((i) =>
                        selectedItems.has(i.productId),
                      )}
                      onChange={() =>
                        toggleSelectAll(items.map((i) => i.productId))
                      }
                      className="w-4 h-4 accent-[#1B5E20] cursor-pointer"
                    />
                    Selecionar Todos ({items.length})
                  </label>
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleRemoveSelected}
                      className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-semibold border border-red-200 rounded px-3 py-1.5 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} /> Excluir selecionados (
                      {selectedItems.size})
                    </button>
                  )}
                </div>
              )}

              {/* Delivery section (Móveis) */}
              {moveiItems.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-green-50 border-b border-green-100">
                    <input
                      type="checkbox"
                      checked={moveiItems.every((i) =>
                        selectedItems.has(i.productId),
                      )}
                      onChange={() =>
                        toggleSelectGroup(moveiItems.map((i) => i.productId))
                      }
                      className="w-4 h-4 accent-[#1B5E20] cursor-pointer"
                    />
                    <Truck size={15} className="text-green-700" />
                    <span className="text-sm font-semibold text-green-800">
                      BrasilLojas — Entrega
                    </span>
                  </div>
                  <AnimatePresence>
                    {moveiItems.map((item) => (
                      <motion.div
                        key={item.productId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 flex gap-3 border-b border-gray-100 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.productId)}
                          onChange={() => toggleSelectItem(item.productId)}
                          className="w-4 h-4 accent-[#1B5E20] cursor-pointer flex-shrink-0 mt-1"
                        />
                        <Link
                          href={`/products/${item.productId}`}
                          className="flex-shrink-0"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded border border-gray-100"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="text-sm font-semibold text-gray-800 hover:text-[#1B5E20] line-clamp-2">
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-base font-bold text-[#C62828] mt-1">
                            {formatBRL(item.price)}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex flex-col items-start gap-1">
                              <div
                                className={`flex items-center border rounded overflow-hidden transition-opacity ${pendingItems.has(item.productId) ? "border-gray-200 opacity-60" : "border-gray-300"}`}
                              >
                                <button
                                  onClick={() =>
                                    handleQtyChange(
                                      item.productId,
                                      item.quantity - 1,
                                    )
                                  }
                                  disabled={pendingItems.has(item.productId)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQtyChange(
                                      item.productId,
                                      item.quantity + 1,
                                    )
                                  }
                                  disabled={
                                    item.quantity >= item.stock ||
                                    pendingItems.has(item.productId)
                                  }
                                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                              <div className="text-[11px] font-medium text-amber-600">
                                <span className="block sm:hidden">
                                  {item.stock} disponível
                                  {item.stock > 1 ? "s" : ""}
                                </span>
                                <span className="hidden sm:block">
                                  {item.stock < 5 &&
                                    `${item.stock} disponível${item.stock > 1 ? "s" : ""}`}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemove(item.productId)}
                              disabled={pendingItems.has(item.productId)}
                              className="text-red-400 hover:text-red-600 p-1 flex items-center gap-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={14} />
                            </button>
                            <p className="ml-auto font-bold text-gray-800 text-sm">
                              {formatBRL(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pickup section (non-Móveis) */}
              {nonMoveiItems.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                    <input
                      type="checkbox"
                      checked={nonMoveiItems.every((i) =>
                        selectedItems.has(i.productId),
                      )}
                      onChange={() =>
                        toggleSelectGroup(nonMoveiItems.map((i) => i.productId))
                      }
                      className="w-4 h-4 accent-[#1B5E20] cursor-pointer"
                    />
                    <Store size={15} className="text-amber-700" />
                    <span className="text-sm font-semibold text-amber-800">
                      BrasilLojas — Retirada na Loja
                    </span>
                  </div>
                  <AnimatePresence>
                    {nonMoveiItems.map((item) => (
                      <motion.div
                        key={item.productId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 flex gap-3 border-b border-gray-100 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.productId)}
                          onChange={() => toggleSelectItem(item.productId)}
                          className="w-4 h-4 accent-[#1B5E20] cursor-pointer flex-shrink-0 mt-1"
                        />
                        <Link
                          href={`/products/${item.productId}`}
                          className="flex-shrink-0"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded border border-gray-100"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="text-sm font-semibold text-gray-800 hover:text-[#1B5E20] line-clamp-2">
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-base font-bold text-[#C62828] mt-1">
                            {formatBRL(item.price)}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex flex-col items-start gap-1">
                              <div
                                className={`flex items-center border rounded overflow-hidden transition-opacity ${pendingItems.has(item.productId) ? "border-gray-200 opacity-60" : "border-gray-300"}`}
                              >
                                <button
                                  onClick={() =>
                                    handleQtyChange(
                                      item.productId,
                                      item.quantity - 1,
                                    )
                                  }
                                  disabled={pendingItems.has(item.productId)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQtyChange(
                                      item.productId,
                                      item.quantity + 1,
                                    )
                                  }
                                  disabled={
                                    item.quantity >= item.stock ||
                                    pendingItems.has(item.productId)
                                  }
                                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                              <div className="text-[11px] font-medium text-amber-600">
                                <span className="block sm:hidden">
                                  {item.stock} disponível
                                  {item.stock > 1 ? "s" : ""}
                                </span>
                                <span className="hidden sm:block">
                                  {item.stock < 5 &&
                                    `${item.stock} disponível${item.stock > 1 ? "s" : ""}`}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemove(item.productId)}
                              disabled={pendingItems.has(item.productId)}
                              className="text-red-400 hover:text-red-600 p-1 flex items-center gap-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={14} />
                            </button>
                            <p className="ml-auto font-bold text-gray-800 text-sm">
                              {formatBRL(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">Retirada na Loja:</span>{" "}
                      Av. Getúlio Vargas, 1010 A — Centro, Pinheiro-MA · (98)
                      3381-4556
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Tag size={16} /> Cupom de Desconto
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="Digite o cupom"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-[#1B5E20] text-white text-sm font-semibold rounded hover:bg-[#2E7D32]"
                  >
                    Aplicar
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-500 text-xs mt-2">{couponError}</p>
                )}
                {couponData?.valid && (
                  <p className="text-green-600 text-xs mt-2 font-medium">
                    Cupom aplicado! Desconto de{" "}
                    {couponData.coupon?.discountType === "percentage"
                      ? `${couponData.coupon.discountValue}%`
                      : formatBRL(couponData.coupon?.discountValue)}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-4">
                  Resumo do Pedido
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatBRL(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Cupom</span>
                      <span>-{formatBRL(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Frete</span>
                    <span className="text-green-600 font-medium">Grátis</span>
                  </div>
                  <hr className="border-gray-200 my-2" />
                  <div className="flex justify-between text-base font-bold text-gray-800">
                    <span>Total estimado</span>
                    <span className="text-[#C62828] text-lg">
                      {formatBRL(total)}
                    </span>
                  </div>

                  {/* Renderiza apenas se o desconto configurado for maior do que zero */}
                  {pixDiscountPercent > 0 && (
                    <p className="text-[11px] text-gray-400">
                      Desconto PIX de {pixDiscountPercent}% aplicado no checkout
                    </p>
                  )}
                </div>

                <Show when="signed-in">
                  {!profileComplete ? (
                    <div className="mt-4">
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs mb-3">
                        <AlertCircle
                          size={14}
                          className="flex-shrink-0 mt-0.5"
                        />
                        <span>
                          Complete seu perfil antes de finalizar a compra.
                        </span>
                      </div>
                      <Link
                        href="/profile"
                        className="w-full py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-md flex items-center justify-center gap-2 text-sm"
                      >
                        Completar Perfil
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/checkout"
                      className="w-full mt-4 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-md flex items-center justify-center gap-2 block text-center"
                    >
                      Finalizar Compra <ArrowRight size={18} />
                    </Link>
                  )}
                </Show>
                <Show when="signed-out">
                  <Link
                    href="/sign-in"
                    className="w-full mt-4 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-md flex items-center justify-center gap-2 block text-center"
                  >
                    Entrar para Finalizar
                  </Link>
                </Show>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
