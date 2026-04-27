import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, QrCode, FileText, Wallet, Truck, Store, ChevronRight,
  Check, ShoppingBag, ArrowLeft, Package, MapPin, Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useGetCart, useCreateOrder, useGetUserProfile, useUpdateUserProfile, useValidateCoupon,
} from "@workspace/api-client-react";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { Show, useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL } from "@/lib/utils";

type PaymentMethod = "pix" | "credit_card" | "debit_card" | "boleto";
type Step = "address" | "payment" | "review";

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string; sub: string; icon: LucideIcon; badge?: string }> = [
  { id: "pix", label: "PIX", sub: "Aprovação imediata", icon: QrCode, badge: "5% OFF" },
  { id: "credit_card", label: "Cartão de Crédito", sub: "Em até 12x sem juros", icon: CreditCard },
  { id: "debit_card", label: "Cartão de Débito", sub: "Aprovação imediata", icon: Wallet },
  { id: "boleto", label: "Boleto Bancário", sub: "Vence em 3 dias úteis", icon: FileText },
];

const STEP_LABELS: Record<Step, string> = {
  address: "Entrega",
  payment: "Pagamento",
  review: "Revisão",
};

const STEPS: Step[] = ["address", "payment", "review"];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
              done ? "bg-[#1B5E20] text-white" : active ? "bg-[#C62828] text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {done ? <Check size={15} /> : i + 1}
            </div>
            <span className={`ml-1.5 text-xs font-medium hidden sm:block ${active ? "text-gray-800" : done ? "text-[#1B5E20]" : "text-gray-400"}`}>
              {STEP_LABELS[step]}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < idx ? "bg-[#1B5E20]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState({ street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "", complement: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const [, setLocation] = useLocation();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart({ query: { retry: false } as any });
  const { data: profile } = useGetUserProfile({ query: { retry: false } as any });
  const createOrder = useCreateOrder();
  const updateProfile = useUpdateUserProfile();
  const { data: couponData } = useValidateCoupon(
    { code: appliedCoupon },
    { query: { enabled: !!appliedCoupon, retry: false } as any }
  );

  // Pre-fill address from profile
  useEffect(() => {
    if (profile?.address?.street && !address.street) {
      setAddress({
        street: profile.address.street ?? "",
        number: profile.address.number ?? "",
        neighborhood: profile.address.neighborhood ?? "",
        city: profile.address.city ?? "",
        state: profile.address.state ?? "",
        zipCode: profile.address.zipCode ?? "",
        complement: profile.address.complement ?? "",
      });
    }
  }, [profile]);

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;
  const subtotal = Number(cart?.subtotal ?? 0);
  const moveiItems = items.filter((i) => i.categorySlug === "moveis");
  const nonMoveiItems = items.filter((i) => i.categorySlug !== "moveis");
  const hasMoveis = moveiItems.length > 0;
  const hasNonMoveis = nonMoveiItems.length > 0;

  const couponDiscount = couponData?.valid && couponData.coupon
    ? couponData.coupon.discountType === "percentage"
      ? subtotal * (Number(couponData.coupon.discountValue) / 100)
      : Number(couponData.coupon.discountValue)
    : 0;
  const pixDiscount = paymentMethod === "pix" ? subtotal * 0.05 : 0;
  const total = Math.max(0, subtotal - couponDiscount - pixDiscount);

  function applyCoupon() {
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim().toUpperCase());
    setCouponError("");
  }

  async function handlePlaceOrder() {
    setStripeError("");
    const shippingAddr = hasMoveis ? address : undefined;

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
          if (hasMoveis && address.street) {
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
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <ShoppingBag size={56} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Carrinho vazio</h2>
          <p className="text-gray-500 mb-6">Adicione produtos para continuar.</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-[#1B5E20] text-white font-bold px-6 py-3 rounded-lg">
            Explorar Produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Title + back */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cart" className="text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Finalizar Compra</h1>
        </div>

        <StepIndicator current={step} />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: steps */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">

              {/* ---- STEP 1: Address ---- */}
              {step === "address" && (
                <motion.div key="address" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
                  {hasMoveis && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <Truck size={18} className="text-[#1B5E20]" /> Endereço de Entrega
                      </h2>
                      <p className="text-xs text-gray-500 mb-4">Para os móveis do seu pedido</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { field: "zipCode", label: "CEP", placeholder: "00000-000", cols: 1 },
                          { field: "street", label: "Rua / Logradouro", placeholder: "Nome da rua", cols: 2 },
                          { field: "number", label: "Número", placeholder: "123", cols: 1 },
                          { field: "complement", label: "Complemento", placeholder: "Apto, Bloco (opcional)", cols: 1 },
                          { field: "neighborhood", label: "Bairro", placeholder: "Nome do bairro", cols: 2 },
                          { field: "city", label: "Cidade", placeholder: "Nome da cidade", cols: 1 },
                          { field: "state", label: "Estado", placeholder: "MA", cols: 1 },
                        ].map(({ field, label, placeholder, cols }) => (
                          <div key={field} style={{ gridColumn: `span ${cols}` }}>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                            <input
                              value={address[field as keyof typeof address] ?? ""}
                              onChange={(e) => setAddress({ ...address, [field]: e.target.value })}
                              placeholder={placeholder}
                              required={field !== "complement"}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasNonMoveis && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mt-4">
                      <Store size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 text-sm">Retirada na Loja</p>
                        <p className="text-xs text-amber-800 mt-1">
                          {nonMoveiItems.map((i) => i.name).join(", ")} {nonMoveiItems.length === 1 ? "será retirado" : "serão retirados"} na nossa loja física.
                        </p>
                        <p className="text-xs text-amber-700 mt-1.5 font-medium">
                          Av. Getúlio Vargas, 1010 A — Centro, Pinheiro-MA · (98) 3381-4556
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setStep("payment")}
                    disabled={hasMoveis && (!address.street || !address.number || !address.zipCode || !address.city || !address.state)}
                    className="mt-4 w-full py-3.5 bg-[#1B5E20] hover:bg-[#2E7D32] disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Continuar para Pagamento <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* ---- STEP 2: Payment ---- */}
              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <CreditCard size={18} className="text-[#1B5E20]" /> Forma de Pagamento
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {PAYMENT_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setPaymentMethod(opt.id)}
                            className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                              paymentMethod === opt.id
                                ? "border-[#1B5E20] bg-green-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {opt.badge && (
                              <span className="absolute top-2 right-2 bg-[#C62828] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                {opt.badge}
                              </span>
                            )}
                            <Icon size={22} className={paymentMethod === opt.id ? "text-[#1B5E20] mb-2" : "text-gray-500 mb-2"} />
                            <p className={`text-sm font-semibold ${paymentMethod === opt.id ? "text-[#1B5E20]" : "text-gray-800"}`}>
                              {opt.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                            {paymentMethod === opt.id && (
                              <span className="absolute top-2.5 left-2.5 w-4 h-4 bg-[#1B5E20] rounded-full flex items-center justify-center">
                                <Check size={10} className="text-white" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
                          <Lock size={14} />
                          Pagamento seguro processado pela Stripe
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Você será redirecionado para a página de pagamento seguro da Stripe para inserir seus dados do cartão.
                        </p>
                      </div>
                    )}
                    {paymentMethod === "pix" && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                        Após confirmar, você receberá o QR code e o código Pix copia e cola.
                      </div>
                    )}
                    {paymentMethod === "boleto" && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        Boleto com vencimento em 3 dias úteis. Pague em qualquer banco ou lotérica.
                      </div>
                    )}
                  </div>

                  {/* Coupon */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-700 text-sm mb-3">Cupom de Desconto</h3>
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Código do cupom"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20] uppercase"
                      />
                      <button onClick={applyCoupon} className="px-4 py-2 bg-[#1B5E20] text-white text-sm font-semibold rounded-lg hover:bg-[#2E7D32] transition-colors">
                        Aplicar
                      </button>
                    </div>
                    {couponData?.valid && couponData.coupon && (
                      <p className="text-xs text-green-600 font-medium mt-2">
                        Cupom aplicado! -{couponData.coupon.discountType === "percentage" ? `${couponData.coupon.discountValue}%` : formatBRL(couponData.coupon.discountValue)}
                      </p>
                    )}
                    {couponError && <p className="text-xs text-red-600 mt-2">{couponError}</p>}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep("address")} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <ArrowLeft size={16} /> Voltar
                    </button>
                    <button onClick={() => setStep("review")} className="flex-1 py-3.5 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                      Revisar Pedido <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ---- STEP 3: Review & Pay ---- */}
              {step === "review" && (
                <motion.div key="review" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-4">
                  {/* Items */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <Package size={18} className="text-[#1B5E20]" /> Itens do Pedido
                    </h2>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3">
                          <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.quantity}x {formatBRL(item.price)}</p>
                          </div>
                          <p className="font-semibold text-sm text-gray-800">{formatBRL(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery info */}
                  {hasMoveis && address.street && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} className="text-[#1B5E20]" />
                        <h3 className="font-semibold text-gray-800 text-sm">Endereço de Entrega</h3>
                        <button onClick={() => setStep("address")} className="ml-auto text-xs text-[#1B5E20] hover:underline">Editar</button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {address.street}, {address.number}{address.complement ? `, ${address.complement}` : ""}<br />
                        {address.neighborhood} — {address.city}/{address.state} · CEP {address.zipCode}
                      </p>
                    </div>
                  )}

                  {/* Payment method */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-[#1B5E20]" />
                      <span className="text-sm text-gray-600 font-medium">
                        {PAYMENT_OPTIONS.find((o) => o.id === paymentMethod)?.label ?? paymentMethod}
                      </span>
                    </div>
                    <button onClick={() => setStep("payment")} className="text-xs text-[#1B5E20] hover:underline">Alterar</button>
                  </div>

                  {stripeError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{stripeError}</p>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setStep("payment")} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <ArrowLeft size={16} /> Voltar
                    </button>
                    <Show when="signed-in">
                      <button
                        onClick={handlePlaceOrder}
                        disabled={createOrder.isPending || stripeLoading}
                        className="flex-1 py-3.5 bg-[#C62828] hover:bg-[#B71C1C] disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {createOrder.isPending || stripeLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processando...
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Confirmar e Pagar {formatBRL(total)}
                          </>
                        )}
                      </button>
                    </Show>
                    <Show when="signed-out">
                      <Link href="/sign-in" className="flex-1 py-3.5 bg-[#C62828] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-center">
                        Entrar para Pagar
                      </Link>
                    </Show>
                  </div>

                  <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Lock size={11} /> Pagamento 100% seguro e criptografado
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Order summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">Resumo do Pedido</h3>

              <div className="space-y-2 text-sm mb-4">
                {items.slice(0, 3).map((item) => (
                  <div key={item.productId} className="flex items-center gap-2">
                    <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover flex-shrink-0 border border-gray-100" />
                    <p className="text-xs text-gray-700 line-clamp-1 flex-1">{item.name}</p>
                    <p className="text-xs font-semibold text-gray-800 flex-shrink-0">{formatBRL(item.price * item.quantity)}</p>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-gray-400">+{items.length - 3} mais item(s)</p>
                )}
              </div>

              <hr className="border-gray-100 mb-3" />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} item{items.length > 1 ? "s" : ""})</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Cupom</span>
                    <span>-{formatBRL(couponDiscount)}</span>
                  </div>
                )}
                {pixDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto PIX (5%)</span>
                    <span>-{formatBRL(pixDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span className="text-green-600 font-medium">Grátis</span>
                </div>
              </div>

              <hr className="border-gray-100 my-3" />

              <div className="flex justify-between font-bold text-base text-gray-800">
                <span>Total</span>
                <span className="text-[#C62828] text-lg">{formatBRL(total)}</span>
              </div>

              {hasMoveis && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <Truck size={13} className="text-[#1B5E20]" />
                  <span>Entrega disponível para móveis</span>
                </div>
              )}
              {hasNonMoveis && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Store size={13} className="text-amber-600" />
                  <span>Retirada na loja para demais itens</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
