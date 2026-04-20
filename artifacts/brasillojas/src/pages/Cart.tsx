import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, Tag, ShoppingBag, ArrowRight } from "lucide-react";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, useClearCart, useValidateCoupon, useCreateOrder } from "@workspace/api-client-react";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { Show } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL } from "@/lib/utils";

export default function CartPage() {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [address, setAddress] = useState({ street: "", number: "", neighborhood: "", city: "", state: "", zipCode: "", complement: "" });
  const [showCheckout, setShowCheckout] = useState(false);
  const [, setLocation] = useLocation();

  const { data: cart, isLoading } = useGetCart({ query: { retry: false } });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();
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

  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    createOrder.mutate(
      { data: { shippingAddress: address, couponCode: appliedCoupon || undefined } },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          setLocation("/orders");
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
          <div className="skeleton h-32 rounded" />
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;
  const subtotal = Number(cart?.subtotal ?? 0);
  const discount = Number(cart?.discount ?? 0) + (couponData?.valid && couponData.coupon
    ? couponData.coupon.discountType === "percentage"
      ? subtotal * (Number(couponData.coupon.discountValue) / 100)
      : Number(couponData.coupon.discountValue)
    : 0);
  const total = subtotal - discount;

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
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold px-8 py-3 rounded-md transition-colors"
            >
              Explorar Produtos <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4"
                  >
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
                          <button
                            onClick={() => handleQtyChange(item.productId, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => handleQtyChange(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                        <p className="ml-auto font-bold text-gray-800">{formatBRL(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              {/* Coupon */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Tag size={16} /> Cupom de Desconto
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Digite o cupom"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-[#1B5E20] text-white text-sm font-semibold rounded hover:bg-[#2E7D32] transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
                {couponData?.valid && (
                  <p className="text-green-600 text-xs mt-2 font-medium">
                    Cupom aplicado! Desconto de {couponData.coupon?.discountType === "percentage"
                      ? `${couponData.coupon.discountValue}%`
                      : formatBRL(couponData.coupon?.discountValue)}
                  </p>
                )}
              </div>

              {/* Order summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-4">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatBRL(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>-{formatBRL(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Frete</span>
                    <span className="text-green-600 font-medium">Grátis</span>
                  </div>
                  <hr className="border-gray-200 my-2" />
                  <div className="flex justify-between text-base font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-[#C62828] text-lg">{formatBRL(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    ou 12x de {formatBRL(total / 12)} sem juros
                  </p>
                </div>

                <Show when="signed-in">
                  <button
                    onClick={() => setShowCheckout(!showCheckout)}
                    className="w-full mt-4 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-md flex items-center justify-center gap-2 transition-colors"
                  >
                    Finalizar Compra <ArrowRight size={18} />
                  </button>
                </Show>
                <Show when="signed-out">
                  <Link
                    href="/sign-in"
                    className="w-full mt-4 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-md flex items-center justify-center gap-2 transition-colors block text-center"
                  >
                    Entrar para Finalizar
                  </Link>
                </Show>
              </div>

              {/* Checkout form */}
              <AnimatePresence>
                {showCheckout && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handlePlaceOrder}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <h3 className="font-bold text-gray-800 mb-4">Endereço de Entrega</h3>
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
                          <input
                            value={(address as any)[field]}
                            onChange={(e) => setAddress({ ...address, [field]: e.target.value })}
                            placeholder={placeholder}
                            required={field !== "complement"}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={createOrder.isPending}
                      className="w-full mt-4 py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-md transition-colors disabled:opacity-70"
                    >
                      {createOrder.isPending ? "Processando..." : "Confirmar Pedido"}
                    </button>
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
