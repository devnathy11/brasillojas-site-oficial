import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Printer,
  MapPin,
  Store,
  CreditCard,
  Package,
  Truck,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useGetOrder, useConfirmDelivery } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL, formatDate } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  boleto: "Boleto Bancário",
};

const TRACKING_STEPS = [
  { key: "criando", label: "Criando seu produto", icon: ShoppingBag },
  { key: "processando", label: "Em processamento", icon: Package },
  { key: "saiu_para_entrega", label: "Saiu para entrega", icon: Truck },
  { key: "entregue", label: "Entregue", icon: PackageCheck },
];

const STEP_INDEX: Record<string, number> = {
  criando: 0,
  processando: 1,
  saiu_para_entrega: 2,
  entregue: 3,
};

const STATUS_LABELS: Record<string, string> = {
  criando: "Criando seu produto",
  processando: "Em processamento",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
};

const STATUS_COLORS: Record<string, string> = {
  criando: "bg-orange-100 text-orange-800",
  processando: "bg-purple-100 text-purple-800",
  saiu_para_entrega: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
};

function OrderTracker({ status }: { status: string }) {
  const currentIndex = STEP_INDEX[status] ?? -1;
  if (currentIndex === -1) return null;

  return (
    <div className="flex items-start justify-between gap-1">
      {TRACKING_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex flex-col items-center flex-1 min-w-0">
            <div className="relative flex items-center w-full">
              {i > 0 && (
                <div
                  className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 ${
                    done || active ? "bg-[#1B5E20]" : "bg-gray-200"
                  }`}
                />
              )}
              {i < TRACKING_STEPS.length - 1 && (
                <div
                  className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 ${
                    done ? "bg-[#1B5E20]" : "bg-gray-200"
                  }`}
                />
              )}
              <div className="relative z-10 mx-auto">
                {done ? (
                  <div className="w-9 h-9 rounded-full bg-[#1B5E20] flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-white" />
                  </div>
                ) : active ? (
                  <div className="w-9 h-9 rounded-full bg-[#1B5E20] flex items-center justify-center ring-4 ring-green-100">
                    <Icon size={16} className="text-white" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <Icon size={16} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <p
              className={`text-[11px] text-center mt-2 leading-tight px-0.5 ${
                active
                  ? "font-bold text-[#1B5E20]"
                  : done
                  ? "text-gray-600"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const { data: order, isLoading } = useGetOrder(orderId);
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const { mutate: doConfirmDelivery, isPending: isConfirming } =
    useConfirmDelivery();

  function handleConfirmDelivery() {
    setConfirmError(null);
    doConfirmDelivery(
      { id: orderId },
      {
        onSuccess: () => {
          setConfirmed(true);
          queryClient.invalidateQueries({
            queryKey: [`/api/orders/${orderId}`],
          });
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        },
        onError: (err: unknown) => {
          setConfirmError(
            err instanceof Error
              ? err.message
              : "Não foi possível confirmar a entrega. Tente novamente."
          );
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="space-y-4">
            <div className="skeleton h-8 w-48 rounded" />
            <div className="skeleton h-40 rounded-lg" />
            <div className="skeleton h-32 rounded-lg" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Pedido não encontrado
          </h2>
          <Link
            href="/orders"
            className="text-[#1B5E20] hover:underline font-medium"
          >
            Voltar para meus pedidos
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStatus = confirmed ? "entregue" : order.status;
  const isDeliveryPending =
    order.status === "saiu_para_entrega" && !confirmed;
  const isDelivered = order.status === "entregue" || confirmed;
  const protocolo = `BL-${String(order.id).padStart(8, "0")}`;
  const isPickup = !order.shippingAddress?.street;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/orders"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B5E20] transition-colors"
          >
            <ArrowLeft size={16} /> Meus pedidos
          </Link>
          <Link
            href={`/receipt/${order.id}`}
            className="flex items-center gap-2 text-sm text-[#1B5E20] hover:underline font-medium"
          >
            <Printer size={15} /> Ver comprovante
          </Link>
        </div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Pedido #{order.id}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {protocolo} · {formatDate(order.createdAt)}
            </p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              STATUS_COLORS[currentStatus] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {STATUS_LABELS[currentStatus] ?? currentStatus}
          </span>
        </div>

        {STEP_INDEX[currentStatus] !== undefined && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-4">
              Rastreamento do pedido
            </p>
            <OrderTracker status={currentStatus} />
          </div>
        )}

        {isDeliveryPending && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Truck size={24} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-blue-900">Seu pedido chegou?</p>
                <p className="text-sm text-blue-700">
                  Confirme o recebimento para finalizar seu pedido.
                </p>
              </div>
            </div>
            {confirmError && (
              <p className="text-sm text-red-600 mb-3">{confirmError}</p>
            )}
            <button
              onClick={handleConfirmDelivery}
              disabled={isConfirming}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <PackageCheck size={18} />
              {isConfirming ? "Confirmando..." : "Confirmar Recebimento"}
            </button>
          </div>
        )}

        {isDelivered && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
            <CheckCircle2 size={28} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-900">Entrega confirmada!</p>
              <p className="text-sm text-green-700">
                Obrigado por comprar na BrasilLojas!
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Itens do pedido</p>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity}x {formatBRL(item.price)}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                  {formatBRL(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatBRL(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Desconto{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>-{formatBRL(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Frete</span>
              <span className="text-green-700 font-medium">Grátis</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>{formatBRL(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            {isPickup ? (
              <Store size={16} className="text-gray-500" />
            ) : (
              <MapPin size={16} className="text-gray-500" />
            )}
            <p className="text-sm font-semibold text-gray-700">
              {isPickup ? "Retirada na loja" : "Endereço de entrega"}
            </p>
          </div>
          {isPickup ? (
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium">BrasilLojas</p>
              <p>Av. Paulista, 1000 — São Paulo/SP</p>
              <p className="text-xs text-gray-500 mt-1">
                Traga seu comprovante para retirar o pedido.
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>
                {order.shippingAddress.street}, {order.shippingAddress.number}
              </p>
              {order.shippingAddress.complement && (
                <p>{order.shippingAddress.complement}</p>
              )}
              <p>{order.shippingAddress.neighborhood}</p>
              <p>
                {order.shippingAddress.city}/{order.shippingAddress.state} —{" "}
                {order.shippingAddress.zipCode}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Pagamento</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {order.paymentMethod != null ? (PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod) : "—"}
            </span>
            {order.paymentStatus === "paid" ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={12} /> Pago
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                <Clock size={12} /> Aguardando pagamento
              </span>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
