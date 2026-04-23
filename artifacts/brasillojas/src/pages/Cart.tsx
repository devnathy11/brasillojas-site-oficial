import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, Tag, ShoppingBag, ArrowRight, CreditCard, QrCode, FileText, Wallet } from "lucide-react";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, useValidateCoupon, useCreateOrder } from "@workspace/api-client-react";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { Show, useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL } from "@/lib/utils";

type PaymentMethod = "pix" | "credit_card" | "debit_card" | "boleto";

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string; sub: string; icon: any }> = [
  { id: "pix", label: "PIX", sub: "Aprovação imediata · 5% de desconto", icon: QrCode },
  { id: "credit_card", label: "Cartão de Crédito", sub: "Em até 12x sem juros", icon: CreditCard },
  { id: "debit_card", label: "Cartão de Débito", sub: "Aprovação imediata", icon: Wallet },
  { id: "boleto", label: "Boleto Bancário", sub: "Vence em 3 dias úteis", icon: FileText },
];

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
  const [, setLocation] = useLocation();
  const { getToken } = useAuth();

  const { data: cart, isLoading } = useGetCart({ query: { retry: false } });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();

  const { data: couponData, refetch: validateCoupon } = useValidateCoupon(appliedCoupon, {
    query: { enabled: !!appliedCoupon, retry: false },
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

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setStripeError("");

    // Card payments → Stripe Checkout (real payment)
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
            shippingAddress: address,
            couponCode: appliedCoupon || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStripeError(data.error ?? "Erro ao iniciar pagamento.");
          setStripeLoading(false);
          return;
        }
        // Redirect browser to Stripe Checkout
        window.location.href = data.url;
      } catch (err: any) {
        setStripeError("Erro de conexão ao iniciar pagamento.");
        setStripeLoading(false);
      }
      return;
    }

    // PIX / Boleto → simulated flow (creates order immediately)
    createOrder.mutate(
      { data: { shippingAddress: address, couponCode: appliedCoupon || undefined, paymentMethod } },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          // Flag the receipt page to auto-print on arrival
          sessionStorage.setItem("bl_autoprint_order", String(order.id));
          setLocation(`/receipt/${order.id}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Carrinho de Compras</h1>

        {isEmpty ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-500 mb-6">Adicione produtos para continuar comprando</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold px-8 py-3 rounded-md transition-colors">
              Explorar Produtos <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div key={item.productId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4">
                    <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-md border border-gray-100" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="text-sm font-semibold text-gray-800 hover:text-[#1B5E20] line-clamp-2">{item.name}</h3>
                      </Link>
                      <p className="text-lg font-bold text-[#C62828] mt-1">{formatBRL(item.price)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                          <button onClick={() => handleQtyChange(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"><Minus size={14} /></button>
                          <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => handleQtyChange(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => handleRemove(item.productId)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                        <p className="ml-auto font-bold text-gray-800">{formatBRL(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
                  <button onClick={() => setShowCheckout(!showCheckout)} className="w-full mt-4 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-md flex items-center justify-center gap-2">
                    Finalizar Compra <ArrowRight size={18} />
                  </button>
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
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3">Endereço de Entrega</h3>
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
                            <input value={(address as any)[field]} onChange={(e) => setAddress({ ...address, [field]: e.target.value })} placeholder={placeholder} required={field !== "complement"} className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]" />
                          </div>
                        ))}
                      </div>
                    </div>

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
