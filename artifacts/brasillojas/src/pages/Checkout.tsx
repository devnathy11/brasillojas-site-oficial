import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Banknote, CreditCard, Truck, Store, ChevronRight,
  Check, ShoppingBag, ArrowLeft, Package, MapPin, MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useGetCart, useCreateOrder, useGetUserProfile, useUpdateUserProfile, useValidateCoupon, useGetSettingsPixDiscount,
} from "@workspace/api-client-react";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { Show } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL } from "@/lib/utils";

type PaymentMethod = "pix" | "dinheiro" | "cartao";
type Step = "address" | "payment" | "review";

// Category slugs that require home delivery (large/heavy items)
const DELIVERY_SLUGS = ["moveis", "eletronicos"];

// WhatsApp sellers list — picked randomly per order
const SELLERS = [
  { name: "Vendedora Fiama", phone: "5598999741848" },
  { name: "Vendedor Hélio Gabriel", phone: "5598984913245" },
  { name: "Vendedor Olicio", phone: "5598984796892" },
  { name: "Vendedor Marcos", phone: "5598984167335" },
  { name: "Vendedor Luiz Felipe", phone: "5598981202842" },
  { name: "Vendedor Juvenal Abreu", phone: "5598987021225" },
  { name: "Vendedor Clodomir", phone: "5598982585119" },
  { name: "Vendedor Lopes", phone: "5598985009486" },
  { name: "Vendedora Solange", phone: "5598989174488" },
  { name: "Vendedora Luciana Moraes", phone: "5598984217100" },
];

function getRandomSeller() {
  return SELLERS[Math.floor(Math.random() * SELLERS.length)];
}

function buildWhatsAppMessage(params: {
  profile: { name: string; email: string; phone?: string | null };
  items: Array<{ name: string; quantity: number; price: number; barcode?: string | null; sku?: string | null }>;
  subtotal: number;
  pixDiscount: number;
  pixDiscountPercent: number;
  couponDiscount: number;
  total: number;
  paymentMethod: PaymentMethod;
  hasDelivery: boolean;
  address: { street: string; number: string; complement?: string; neighborhood: string; city: string; state: string; zipCode: string };
  orderId: number;
}): string {
  const { profile, items, subtotal, pixDiscount, pixDiscountPercent, couponDiscount, total, paymentMethod, hasDelivery, address, orderId } = params;

  const paymentLabels: Record<PaymentMethod, string> = {
    pix: pixDiscountPercent > 0 ? `PIX (${pixDiscountPercent}% de desconto)` : "PIX",
    dinheiro: "Dinheiro (pagamento na entrega/retirada)",
    cartao: "Cartão na loja física (parcela em até 12x)",
  };

  const lines: string[] = [
    "🛒 *Novo Pedido — BrasilLojas*",
    "",
    "━━━━━━━━━━━━ CLIENTE ━━━━━━━━━━━━",
    `*Nome:* ${profile.name}`,
    `*Telefone:* ${profile.phone ?? "não informado"}`,
    `*E-mail:* ${profile.email}`,
    "",
    "━━━━━━━━━━━━ ITENS ━━━━━━━━━━━━",
    ...items.map((i) => {
      const barcodeInfo = i.barcode ? `\n   📦 Cód. Barras: ${i.barcode}` : (i.sku ? `\n   🏷️ Cód. Fab.: ${i.sku}` : "");
      return `• *${i.name}*\n   Qtd: ${i.quantity}x — ${formatBRL(i.price * i.quantity)}${barcodeInfo}`;
    }),
    "",
    `*Subtotal:* ${formatBRL(subtotal)}`,
  ];

  if (couponDiscount > 0) lines.push(`*Desconto Cupom:* -${formatBRL(couponDiscount)}`);
  if (pixDiscount > 0) lines.push(`*Desconto PIX (${pixDiscountPercent}%):* -${formatBRL(pixDiscount)}`);
  lines.push(`*Total:* ${formatBRL(total)}`);
  lines.push("", `*Forma de Pagamento:* ${paymentLabels[paymentMethod]}`);

  if (hasDelivery && address.street) {
    lines.push("", "*Endereço de Entrega:*");
    lines.push(`${address.street}, nº ${address.number}${address.complement ? `, ${address.complement}` : ""}`);
    lines.push(`${address.neighborhood} — ${address.city}/${address.state}`);
    lines.push(`CEP: ${address.zipCode}`);
  } else {
    lines.push("", "📍 *Retirada na loja:* Av. Getúlio Vargas, 1010 A — Centro, Pinheiro-MA");
  }

  lines.push("", `*Pedido nº:* #${orderId}`);
  return lines.join("\n");
}

function getPaymentOptions(pixPercent: number): Array<{ id: PaymentMethod; label: string; sub: string; icon: LucideIcon; badge?: string }> {
  return [
    {
      id: "pix",
      label: "PIX",
      sub: pixPercent > 0 ? `${pixPercent}% de desconto no total` : "Pagamento instantâneo",
      icon: QrCode,
      badge: pixPercent > 0 ? `${pixPercent}% OFF` : undefined,
    },
    { id: "dinheiro", label: "Dinheiro", sub: "Pague na entrega ou retirada", icon: Banknote },
    { id: "cartao", label: "Cartão (na loja)", sub: "Parcele em até 12x — passe na loja física", icon: CreditCard },
  ];
}

const STEP_LABELS: Record<Step, string> = {
  address: "Endereço",
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
  const [orderError, setOrderError] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart({ query: { retry: false } as any });
  const { data: profile } = useGetUserProfile({ query: { retry: false } as any });
  const { data: pixSetting } = useGetSettingsPixDiscount();
  const pixDiscountPercent = pixSetting?.percent ?? 0;
  const createOrder = useCreateOrder();
  const updateProfile = useUpdateUserProfile();
  const { data: couponData } = useValidateCoupon(
    appliedCoupon,
    { query: { enabled: !!appliedCoupon, retry: false } as any }
  );

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

  const deliveryItems = items.filter((i) => DELIVERY_SLUGS.includes(i.categorySlug ?? ""));
  const pickupItems = items.filter((i) => !DELIVERY_SLUGS.includes(i.categorySlug ?? ""));
  const hasDelivery = deliveryItems.length > 0;
  const hasPickup = pickupItems.length > 0;

  const couponDiscount = couponData?.valid && couponData.coupon
    ? couponData.coupon.discountType === "percentage"
      ? subtotal * (Number(couponData.coupon.discountValue) / 100)
      : Number(couponData.coupon.discountValue)
    : 0;
  const pixDiscount = paymentMethod === "pix" ? subtotal * (pixDiscountPercent / 100) : 0;
  const total = Math.max(0, subtotal - couponDiscount - pixDiscount);

  function applyCoupon() {
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim().toUpperCase());
    setCouponError("");
  }

  async function handlePlaceOrder() {
    setOrderError("");
    createOrder.mutate(
      {
        data: {
          shippingAddress: hasDelivery ? address : undefined,
          couponCode: appliedCoupon || undefined,
          paymentMethod: paymentMethod as any,
        },
      },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });

          if (hasDelivery && address.street && profile?.name) {
            updateProfile.mutate({
              data: { name: profile.name, email: profile.email, phone: profile.phone ?? "", address },
            });
          }

          const seller = getRandomSeller();
          const message = buildWhatsAppMessage({
            profile: { name: profile?.name ?? "", email: profile?.email ?? "", phone: profile?.phone },
            items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price, barcode: (i as any).barcode, sku: (i as any).sku })),
            subtotal,
            pixDiscount,
            pixDiscountPercent,
            couponDiscount,
            total,
            paymentMethod,
            hasDelivery,
            address,
            orderId: order.id,
          });

          window.location.href = `https://wa.me/${seller.phone}?text=${encodeURIComponent(message)}`;
        },
        onError: () => {
          setOrderError("Erro ao registrar pedido. Verifique seu perfil e tente novamente.");
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
          <div className="skeleton h-64 rounded mb-4" />
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag size={56} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-700 mb-2">Carrinho vazio</h1>
          <p className="text-gray-500 mb-6">Adicione produtos antes de finalizar a compra.</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-[#1B5E20] text-white font-bold px-8 py-3 rounded-lg">
            Ver Produtos
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/cart" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
            <ArrowLeft size={16} /> Carrinho
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-800">Finalizar Compra</span>
        </div>

        <StepIndicator current={step} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">

              {/* STEP 1: Address */}
              {step === "address" && (
                <motion.div key="address" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-1">
                      <Truck size={18} className="text-[#1B5E20]" /> Endereço
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                      {hasDelivery ? "Para entrega dos itens de grande porte" : "Para registro e contato do pedido"}
                    </p>
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
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]/20"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {hasPickup && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                      <Store size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 text-sm">Retirada na Loja</p>
                        <p className="text-xs text-amber-800 mt-1">
                          {pickupItems.map((i) => i.name).join(", ")} {pickupItems.length === 1 ? "será retirado" : "serão retirados"} na nossa loja física.
                        </p>
                        <p className="text-xs text-amber-700 mt-1.5 font-medium">
                          Av. Getúlio Vargas, 1010 A — Centro, Pinheiro-MA · (98) 3381-4556
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setStep("payment")}
                    disabled={!address.street || !address.number || !address.zipCode || !address.city || !address.state}
                    className="w-full py-3.5 bg-[#1B5E20] hover:bg-[#2E7D32] disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Continuar para Pagamento <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Payment */}
              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <CreditCard size={18} className="text-[#1B5E20]" /> Forma de Pagamento
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {getPaymentOptions(pixDiscountPercent).map((opt) => {
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
                            <Icon size={22} className={`mb-2 ${paymentMethod === opt.id ? "text-[#1B5E20]" : "text-gray-500"}`} />
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

                    {paymentMethod === "pix" && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                        <p className="font-semibold mb-1">{pixDiscountPercent > 0 ? `⚡ Pagamento via PIX — ${pixDiscountPercent}% OFF` : "⚡ Pagamento via PIX"}</p>
                        <p className="text-xs">Após confirmar, você receberá a chave PIX via WhatsApp. Pague e aguarde a confirmação do vendedor.</p>
                      </div>
                    )}
                    {paymentMethod === "dinheiro" && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <p className="font-semibold mb-1">💵 Pagamento em Dinheiro</p>
                        <p className="text-xs">Pague no momento da entrega ou ao retirar na loja. Combine os detalhes com o vendedor via WhatsApp.</p>
                      </div>
                    )}
                    {paymentMethod === "cartao" && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        <p className="font-semibold mb-1">💳 Cartão na Loja Física</p>
                        <p className="text-xs">Após confirmar, compareça à nossa loja para passar o cartão. Parcelamos em até 12x sem juros!</p>
                        <p className="text-xs mt-1 font-medium">Av. Getúlio Vargas, 1010 A — Centro, Pinheiro-MA</p>
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

              {/* STEP 3: Review & Confirm */}
              {step === "review" && (
                <motion.div key="review" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-4">
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

                  {hasDelivery && address.street && (
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

                  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-[#1B5E20]" />
                      <span className="text-sm text-gray-600 font-medium">
                        {getPaymentOptions(pixDiscountPercent).find((o) => o.id === paymentMethod)?.label ?? paymentMethod}
                      </span>
                    </div>
                    <button onClick={() => setStep("payment")} className="text-xs text-[#1B5E20] hover:underline">Alterar</button>
                  </div>

                  {orderError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{orderError}</p>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setStep("payment")} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <ArrowLeft size={16} /> Voltar
                    </button>
                    <Show when="signed-in">
                      <button
                        onClick={handlePlaceOrder}
                        disabled={createOrder.isPending}
                        className="flex-1 py-3.5 bg-[#25D366] hover:bg-[#1DAA56] disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {createOrder.isPending ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Registrando...
                          </>
                        ) : (
                          <>
                            <MessageCircle size={18} />
                            Confirmar e ir para WhatsApp
                          </>
                        )}
                      </button>
                    </Show>
                    <Show when="signed-out">
                      <Link href="/sign-in" className="flex-1 py-3.5 bg-[#C62828] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-center">
                        Entrar para Finalizar
                      </Link>
                    </Show>
                  </div>

                  <p className="text-center text-xs text-gray-400">
                    Ao confirmar, você será direcionado ao WhatsApp de um vendedor para finalizar o pagamento.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order summary sidebar */}
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
                {items.length > 3 && <p className="text-xs text-gray-400">+{items.length - 3} mais item(s)</p>}
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
                    <span>Desconto PIX ({pixDiscountPercent}%)</span>
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

              {hasDelivery && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <Truck size={13} className="text-[#1B5E20]" />
                  <span>Entrega para itens de grande porte</span>
                </div>
              )}
              {hasPickup && (
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
