import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, Tag, ShoppingBag, ArrowRight, CreditCard, QrCode, FileText, Wallet, Truck, Store, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, useValidateCoupon, useCreateOrder, useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { Show, useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL } from "@/lib/utils";

type PaymentMethod = "pix" | "credit_card" | "debit_card" | "boleto";

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string; sub: string; icon: LucideIcon }> = [
  { id: "pix", label: "PIX", sub: "Aprovação imediata · 5% de desconto", icon: QrCode },
  { id: "credit_card", label: "Cartão de Crédito", sub: "Em até 12x sem juros", icon: CreditCard },
  { id: "debit_card", label: "Cartão de Débito", sub: "Aprovação imediata", icon: Wallet },
  { id: "boleto", label: "Boleto Bancário", sub: "Vence em 3 dias úteis", icon: FileText },
];

function isProfileComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return !!(
    profile.name &&
    profile.email &&
    profile.recoveryEmail &&
    profile.phone &&
    profile.address?.zipCode &&
    profile.address?.street &&
    profile.address?.number &&
    profile.address?.neighborhood &&
    profile.address?.city &&
    profile.address?.state
  );
}

export default function CartPage() {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [address, setAddress] = useState({ street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "", complement: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "", installments: 1 });
  const [showCheckout, setShowCheckout] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [, setLocation] = useLocation();
  const { getToken } = useAuth();

  const { data: cart, isLoading } = useGetCart({ query: { retry: false } as any });
  const { data: profile } = useGetUserProfile({ query: { retry: false } as any });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const createOrder = useCreateOrder();
  const updateProfile = useUpdateUserProfile();
  const queryClient = useQueryClient();

  const { data: couponData, refetch: validateCoupon } = useValidateCoupon(appliedCoupon, {
    query: { enabled: !!appliedCoupon, retry: false } as any,
  });

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
    if (qty < 1) {
      removeItem.mutate({ productId }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) });
    } else {
      updateItem.mutate({ productId, data: { quantity: qty } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) });
    }
  }

  function handleRemove(productId: number) {
    removeItem.mutate({ productId }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) });
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
      productIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
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
    setTimeout(() => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }), 300);
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setStripeError("");

    const hasMoveisItems = moveiItems.length > 0;
    // Only include a shippingAddress when Móveis items are in the cart
    const shippingAddr = hasMoveisItems ? address : undefined;

    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      setStripeLoading(true);
      try {
        const token = await getToken();
        const res = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            shippingAddress: shippingAddr,
            couponCode: appliedCoupon || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStripeError(data.error ?? "Erro ao iniciar pagamento.");
          setStripeLoading(false);
          return;
        }
        window.location.href = data.url;
      } catch {
        setStripeError("Erro de conexão ao iniciar pagamento.");
        setStripeLoading(false);
      }
      return;
    }

    createOrder.mutate(
      { data: { shippingAddress: shippingAddr, couponCode: appliedCoupon || undefined, paymentMethod } },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          // If Móveis items were purchased, save the shipping address to the customer profile
          if (moveiItems.length > 0 && address.street) {
            updateProfile.mutate({
              data: {
                name: profile?.name ?? "",
                email: profile?.email ?? "",
                recoveryEmail: profile?.recoveryEmail ?? "",
                phone: profile?.phone ?? "",
                address: shippingAddr ?? address,
              },
            });
          }
          setLocation(`/order-confirmation/${order.id}`);
        },
      }
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
  const isEmpty = items.length === 0;
  const subtotal = Number(cart?.subtotal ?? 0);
  const couponDiscount = couponData?.valid && couponData.coupon
    ? couponData.coupon.discountType === "percentage"
      ? subtotal * (Number(couponData.coupon.discountValue) / 100)
      : Number(couponData.coupon.discountValue)
    : 0;
  const pixDiscount = paymentMethod === "pix" ? subtotal * 0.05 : 0;
  const discount = Number(cart?.discount ?? 0) + couponDiscount + pixDiscount;
  const total = Math.max(0, subtotal - discount);

  const moveiItems = items.filter((item) => item.categorySlug === "moveis");
  const nonMoveiItems = items.filter((item) => item.categorySlug !== "moveis");
  const allMoveis = items.length > 0 && nonMoveiItems.length === 0;
  const hasNonMoveis = nonMoveiItems.length > 0;
  const profileComplete = isProfileComplete(profile);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Carrinho de Compras</h1>

        {isEmpty ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-16 text-center">
            <ShoppingBag size={56} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-500 mb-6">Adicione produtos para continuar comprando</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold px-8 py-3 rounded-md transition-colors">
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
                      checked={items.every((i) => selectedItems.has(i.productId))}
                      onChange={() => toggleSelectAll(items.map((i) => i.productId))}
                      className="w-4 h-4 accent-[#1B5E20] cursor-pointer"
                    />
                    Selecionar Todos ({items.length})
                  </label>
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleRemoveSelected}
                      className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-semibold border border-red-200 rounded px-3 py-1.5 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} /> Excluir selecionados ({selectedItems.size})
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
                      checked={moveiItems.every((i) => selectedItems.has(i.productId))}
                      onChange={() => toggleSelectGroup(moveiItems.map((i) => i.productId))}
                      className="w-4 h-4 accent-[#1B5E20] cursor-pointer"
                    />
                    <Truck size={15} className="text-green-700" />
                    <span className="text-sm font-semibold text-green-800">BrasilLojas — Entrega</span>
                  </div>
                  <AnimatePresence>
                    {moveiItems.map((item) => (
                      <motion.div key={item.productId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 flex gap-3 border-b border-gray-100 last:border-0">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.productId)}
                          onChange={() => toggleSelectItem(item.productId)}
                          className="w-4 h-4 accent-[#1B5E20] cursor-pointer flex-shrink-0 mt-1"
                        />
                        <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded border border-gray-100" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="text-sm font-semibold text-gray-800 hover:text-[#1B5E20] line-clamp-2">{item.name}</h3>
                          </Link>
                          <p className="text-base font-bold text-[#C62828] mt-1">{formatBRL(item.price)}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                              <button onClick={() => handleQtyChange(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100"><Minus size={13} /></button>
                              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <button onClick={() => handleQtyChange(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"><Plus size={13} /></button>
                            </div>
                            <button onClick={() => handleRemove(item.productId)} className="text-red-400 hover:text-red-600 p-1 flex items-center gap-1 text-xs"><Trash2 size={14} /></button>
                            <p className="ml-auto font-bold text-gray-800 text-sm">{formatBRL(item.price * item.quantity)}</p>
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
                      checked={nonMoveiItems.every((i) => selectedItems.has(i.productId))}
                      onChange={() => toggleSelectGroup(nonMoveiItems.map((i) => i.productId))}
                      className="w-4 h-4 accent-[#1B5E20] cursor-pointer"
                    />
                    <Store size={15} className="text-amber-700" />
                    <span className="text-sm font-semibold text-amber-800">BrasilLojas — Retirada na Loja</span>
                  </div>
                  <AnimatePresence>
                    {nonMoveiItems.map((item) => (
                      <motion.div key={item.productId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 flex gap-3 border-b border-gray-100 last:border-0">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.productId)}
                          onChange={() => toggleSelectItem(item.productId)}
                          className="w-4 h-4 accent-[#1B5E20] cursor-pointer flex-shrink-0 mt-1"
                        />
                        <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded border border-gray-100" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="text-sm font-semibold text-gray-800 hover:text-[#1B5E20] line-clamp-2">{item.name}</h3>
                          </Link>
                          <p className="text-base font-bold text-[#C62828] mt-1">{formatBRL(item.price)}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                              <button onClick={() => handleQtyChange(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100"><Minus size={13} /></button>
                              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <button onClick={() => handleQtyChange(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"><Plus size={13} /></button>
                            </div>
                            <button onClick={() => handleRemove(item.productId)} className="text-red-400 hover:text-red-600 p-1 flex items-center gap-1 text-xs"><Trash2 size={14} /></button>
                            <p className="ml-auto font-bold text-gray-800 text-sm">{formatBRL(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs text-amber-800">
                      <span className="font-semibold">Retirada na Loja:</span> Av. Getúlio Vargas, 1010 A — Centro, Pinheiro-MA · (98) 3381-4556
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Tag size={16} /> Cupom de Desconto</h3>
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Digite o cupom" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]" />
                  <button onClick={handleApplyCoupon} className="px-4 py-2 bg-[#1B5E20] text-white text-sm font-semibold rounded hover:bg-[#2E7D32]">Aplicar</button>
                </div>
                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
                {couponData?.valid && (
                  <p className="text-green-600 text-xs mt-2 font-medium">
                    Cupom aplicado! Desconto de {couponData.coupon?.discountType === "percentage" ? `${couponData.coupon.discountValue}%` : formatBRL(couponData.coupon?.discountValue)}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-4">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatBRL(subtotal)}</span></div>
                  {couponDiscount > 0 && (<div className="flex justify-between text-green-600"><span>Cupom</span><span>-{formatBRL(couponDiscount)}</span></div>)}
                  {pixDiscount > 0 && (<div className="flex justify-between text-green-600"><span>Desconto PIX (5%)</span><span>-{formatBRL(pixDiscount)}</span></div>)}
                  <div className="flex justify-between text-gray-600"><span>Frete</span><span className="text-green-600 font-medium">Grátis</span></div>
                  <hr className="border-gray-200 my-2" />
                  <div className="flex justify-between text-base font-bold text-gray-800"><span>Total</span><span className="text-[#C62828] text-lg">{formatBRL(total)}</span></div>
                  {paymentMethod === "credit_card" && (
                    <p className="text-xs text-gray-500">ou {card.installments}x de {formatBRL(total / card.installments)} sem juros</p>
                  )}
                </div>

                <Show when="signed-in">
                  {!profileComplete ? (
                    <div className="mt-4">
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs mb-3">
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Complete seu perfil antes de finalizar a compra.</span>
                      </div>
                      <Link href="/profile" className="w-full py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-md flex items-center justify-center gap-2 text-sm">
                        Completar Perfil
                      </Link>
                    </div>
                  ) : (
                    <button onClick={() => setShowCheckout(!showCheckout)} className="w-full mt-4 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-md flex items-center justify-center gap-2">
                      Finalizar Compra <ArrowRight size={18} />
                    </button>
                  )}
                </Show>
                <Show when="signed-out">
                  <Link href="/sign-in" className="w-full mt-4 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-md flex items-center justify-center gap-2 block text-center">
                    Entrar para Finalizar
                  </Link>
                </Show>
              </div>

              <AnimatePresence>
                {showCheckout && (
                  <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handlePlaceOrder} className="bg-white rounded-lg border border-gray-200 p-4 space-y-5">

                    {allMoveis && (
                      <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Truck size={16} /> Endereço de Entrega</h3>
                        <div className="space-y-3">
                          {[
                            { field: "zipCode", label: "CEP", placeholder: "00000-000" },
                            { field: "street", label: "Rua", placeholder: "Nome da rua" },
                            { field: "number", label: "Número", placeholder: "123" },
                            { field: "complement", label: "Complemento", placeholder: "Apto, Bloco (opcional)" },
                            { field: "neighborhood", label: "Bairro", placeholder: "Nome do bairro" },
                            { field: "city", label: "Cidade", placeholder: "Nome da cidade" },
                            { field: "state", label: "Estado", placeholder: "SP" },
                          ].map(({ field, label, placeholder }) => (
                            <div key={field}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                              <input value={address[field as keyof typeof address] ?? ""} onChange={(e) => setAddress({ ...address, [field]: e.target.value })} placeholder={placeholder} required={field !== "complement"} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasNonMoveis && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <p className="font-semibold flex items-center gap-1 mb-1"><Store size={13} /> Retirada na Loja</p>
                        <p>
                          {nonMoveiItems.map((i) => i.name).join(", ")} {nonMoveiItems.length === 1 ? "deve ser retirado" : "devem ser retirados"} em nossa loja física após a confirmação do pedido.
                        </p>
                      </div>
                    )}

                    {moveiItems.length > 0 && hasNonMoveis && (
                      <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Truck size={16} /> Endereço de Entrega (Móveis)</h3>
                        <div className="space-y-3">
                          {[
                            { field: "zipCode", label: "CEP", placeholder: "00000-000" },
                            { field: "street", label: "Rua", placeholder: "Nome da rua" },
                            { field: "number", label: "Número", placeholder: "123" },
                            { field: "complement", label: "Complemento", placeholder: "Apto, Bloco (opcional)" },
                            { field: "neighborhood", label: "Bairro", placeholder: "Nome do bairro" },
                            { field: "city", label: "Cidade", placeholder: "Nome da cidade" },
                            { field: "state", label: "Estado", placeholder: "SP" },
                          ].map(({ field, label, placeholder }) => (
                            <div key={field}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                              <input value={address[field as keyof typeof address] ?? ""} onChange={(e) => setAddress({ ...address, [field]: e.target.value })} placeholder={placeholder} required={field !== "complement"} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-gray-800 mb-3">Forma de Pagamento</h3>
                      <div className="space-y-2">
                        {PAYMENT_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const selected = paymentMethod === opt.id;
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              onClick={() => setPaymentMethod(opt.id)}
                              className={`w-full flex items-center gap-3 px-3 py-3 rounded border-2 text-left transition-colors ${selected ? "border-[#1B5E20] bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                            >
                              <Icon size={20} className={selected ? "text-[#1B5E20]" : "text-gray-500"} />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                                <p className="text-xs text-gray-500">{opt.sub}</p>
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 ${selected ? "border-[#1B5E20] bg-[#1B5E20]" : "border-gray-300"}`} />
                            </button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2 overflow-hidden">
                            <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19) })} placeholder="Número do cartão" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]" />
                            <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} placeholder="Nome impresso no cartão" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]" />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5) })} placeholder="MM/AA" className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]" />
                              <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="CVV" className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]" />
                            </div>
                            {paymentMethod === "credit_card" && (
                              <select value={card.installments} onChange={(e) => setCard({ ...card, installments: Number(e.target.value) })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]">
                                {[1, 2, 3, 6, 10, 12].map((n) => (
                                  <option key={n} value={n}>{n}x de {formatBRL(total / n)} sem juros</option>
                                ))}
                              </select>
                            )}
                          </motion.div>
                        )}
                        {paymentMethod === "pix" && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                            Você receberá o QR Code PIX ao confirmar o pedido. Aprovação imediata após o pagamento.
                          </motion.div>
                        )}
                        {paymentMethod === "boleto" && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            O boleto será gerado após a confirmação. Vencimento em 3 dias úteis.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {stripeError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{stripeError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={createOrder.isPending || stripeLoading}
                      className="w-full py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-md transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {(createOrder.isPending || stripeLoading) ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Processando pagamento...
                        </>
                      ) : (
                        `Pagar ${formatBRL(total)}`
                      )}
                    </button>
                    {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
                      <p className="text-[11px] text-center text-gray-400">🔒 Pagamento processado com segurança pelo Stripe</p>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
