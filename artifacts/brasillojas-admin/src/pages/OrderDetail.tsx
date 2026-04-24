import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Package,
  ChevronRight,
  Printer,
} from "lucide-react";
import { useGetAdminOrder, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatBRL, formatDate } from "@/lib/utils";
import { getAdminOrderQueryKey } from "@workspace/api-client-react";

const statusLabel: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  criando: "Criando produto",
  processando: "Em processamento",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  criando: "bg-orange-100 text-orange-800",
  processando: "bg-purple-100 text-purple-800",
  saiu_para_entrega: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
};

const paymentLabel: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  boleto: "Boleto Bancário",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  criando: "Mover para: Em processamento",
  processando: "Mover para: Saiu para entrega",
};

const STATUS_STEPS = [
  { key: "criando", label: "Criando produto" },
  { key: "processando", label: "Em processamento" },
  { key: "saiu_para_entrega", label: "Saiu para entrega" },
  { key: "entregue", label: "Entregue" },
];

function escHtml(str: string | null | undefined): string {
  if (!str) return "—";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildReceiptHtml(order: ReturnType<typeof useGetAdminOrder>["data"]): string {
  if (!order) return "";
  const now = new Date().toLocaleString("pt-BR");
  const addr = order.shippingAddress as any;
  const addressStr = addr
    ? `${escHtml(addr.street)}, ${escHtml(addr.number)}${addr.complement ? " " + escHtml(addr.complement) : ""}<br/>${escHtml(addr.neighborhood)} – ${escHtml(addr.city)}/${escHtml(addr.state)}<br/>CEP: ${escHtml(addr.zipCode)}`
    : "Retirada na Loja";
  const itemsRows = (order.items as any[]).map((it) =>
    `<tr><td>${escHtml(it.name)}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${formatBRL(it.price)}</td><td style="text-align:right">${formatBRL(it.price * it.quantity)}</td></tr>`
  ).join("");
  const paymentStatus = order.paymentStatus === "paid" ? "PAGO" : "AGUARDANDO PAGAMENTO";
  const customer = (order as any).customerName ?? order.userId;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Comprovante #${order.id} – BrasilLojas</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #111; width: 80mm; margin: 0 auto; padding: 8px; }
  h1 { font-size: 16px; text-align: center; font-weight: bold; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 8px; }
  .meta { margin-bottom: 8px; font-size: 11px; }
  .label { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { font-size: 10px; text-align: left; border-bottom: 1px dashed #555; padding: 2px 0; }
  td { font-size: 11px; padding: 2px 0; border-bottom: 1px dotted #ccc; }
  .total-row { border-top: 2px solid #111; font-weight: bold; }
  .status { text-align: center; font-size: 14px; font-weight: bold; padding: 6px; margin: 8px 0; border: 2px solid #111; }
  .footer { text-align: center; font-size: 10px; color: #555; border-top: 1px dashed #ccc; padding-top: 6px; margin-top: 8px; }
  @media print { @page { size: 80mm auto; margin: 0; } body { width: 100%; } }
</style>
</head>
<body>
<h1>BRASILLOJAS</h1>
<div class="meta">
  <p>Comprovante: <span class="label">#${order.id}</span></p>
  <p>Data: ${escHtml(formatDate(order.createdAt))}</p>
  <p>Emitido em: ${escHtml(now)}</p>
  <p>Cliente: ${escHtml(customer)}</p>
</div>
<table>
  <thead><tr><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Unit.</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${itemsRows}</tbody>
</table>
<table>
  <tbody>
    ${order.discount > 0 ? `<tr><td>Desconto</td><td style="text-align:right">-${formatBRL(order.discount)}</td></tr>` : ""}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${formatBRL(order.total)}</td></tr>
  </tbody>
</table>
<p><span class="label">Forma de pagamento:</span> ${escHtml(order.paymentMethod ? (paymentLabel[order.paymentMethod] ?? order.paymentMethod) : "—")}</p>
<div class="status">${paymentStatus}</div>
<div class="meta">
  <p class="label">Endereço de entrega:</p>
  <p>${addressStr}</p>
</div>
<div class="footer">
  <p>Obrigado pela preferência!</p>
  <p>www.brasillojas.com.br</p>
</div>
</body>
</html>`;
}

function StatusStepper({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  if (currentIdx === -1) return null;

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isLast = i === STATUS_STEPS.length - 1;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${done ? "bg-[#1B5E20] text-white" : "bg-gray-200 text-gray-400"}`}
              >
                {i + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center max-w-[64px] leading-tight ${done ? "text-[#1B5E20] font-semibold" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-8 mx-1 mb-5 transition-colors ${i < currentIdx ? "bg-[#1B5E20]" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = parseInt(params.id, 10);
  const queryClient = useQueryClient();
  const { data: order, isLoading, error } = useGetAdminOrder(id);
  const { mutate: advanceStatus, isPending: isAdvancing } = useUpdateOrderStatus();
  const [statusError, setStatusError] = useState<string | null>(null);

  const nextLabel = order ? NEXT_STATUS_LABEL[order.status] : null;

  function handleAdvance() {
    if (!order) return;
    setStatusError(null);
    advanceStatus(
      { id: order.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/orders/all"] });
          queryClient.invalidateQueries({ queryKey: getAdminOrderQueryKey(order.id) });
        },
        onError: (err: unknown) => {
          setStatusError(err instanceof Error ? err.message : "Erro ao atualizar status");
        },
      }
    );
  }

  function handlePrint() {
    if (!order) return;
    const html = buildReceiptHtml(order);
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="w-8 h-8 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Carregando pedido...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium mb-4">Pedido não encontrado.</p>
        <button
          onClick={() => setLocation("/orders")}
          className="text-sm text-[#1B5E20] hover:underline"
        >
          ← Voltar para Pedidos
        </button>
      </div>
    );
  }

  const addr = order.shippingAddress as any;
  const items = order.items as any[];
  const customerName = (order as any).customerName as string | null;
  const customerEmail = (order as any).customerEmail as string | null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setLocation("/orders")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B5E20] transition-colors"
        >
          <ArrowLeft size={16} />
          Pedidos
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">Pedido #{order.id}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pedido #{order.id}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${statusColor[order.status] ?? "bg-gray-100 text-gray-600"}`}>
            {statusLabel[order.status] ?? order.status}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer size={15} />
            Comprovante
          </button>
          {nextLabel && (
            <button
              onClick={handleAdvance}
              disabled={isAdvancing}
              className="flex items-center gap-1.5 bg-[#1B5E20] hover:bg-[#2E7D32] disabled:opacity-60 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <ChevronRight size={15} />
              {isAdvancing ? "Atualizando..." : nextLabel}
            </button>
          )}
        </div>
      </div>

      {statusError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {statusError}
        </div>
      )}

      {STATUS_STEPS.some((s) => s.key === order.status) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Progresso do Pedido</h2>
          <StatusStepper status={order.status} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package size={16} className="text-[#1B5E20]" />
              <h2 className="font-semibold text-gray-800">Itens do Pedido</h2>
              <span className="ml-auto text-xs text-gray-400">{items.length} {items.length === 1 ? "item" : "itens"}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">{formatBRL(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{formatBRL(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <User size={16} className="text-[#1B5E20]" />
              <h2 className="font-semibold text-gray-800">Cliente</h2>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              <p className="font-medium text-gray-800">{customerName ?? "—"}</p>
              {customerEmail && <p className="text-gray-500">{customerEmail}</p>}
              <p className="text-gray-400 text-xs break-all">{order.userId}</p>
            </div>
          </div>

          {addr && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <MapPin size={16} className="text-[#1B5E20]" />
                <h2 className="font-semibold text-gray-800">Endereço de Entrega</h2>
              </div>
              <div className="px-5 py-4 text-sm text-gray-600 space-y-1">
                <p>{addr.street}, {addr.number}{addr.complement ? ` ${addr.complement}` : ""}</p>
                <p>{addr.neighborhood}</p>
                <p>{addr.city} / {addr.state}</p>
                <p className="text-gray-400">CEP: {addr.zipCode}</p>
              </div>
            </div>
          )}

          {!addr && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <MapPin size={16} className="text-[#1B5E20]" />
                <h2 className="font-semibold text-gray-800">Entrega</h2>
              </div>
              <div className="px-5 py-4 text-sm text-gray-500">Retirada na loja</div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <CreditCard size={16} className="text-[#1B5E20]" />
              <h2 className="font-semibold text-gray-800">Pagamento</h2>
            </div>
            <div className="px-5 py-4 text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Método</span>
                <span className="font-medium text-gray-800">
                  {order.paymentMethod ? (paymentLabel[order.paymentMethod] ?? order.paymentMethod) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {order.paymentStatus === "paid" ? "Pago" : "Aguardando"}
                </span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cupom</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{order.couponCode}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatBRL(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatBRL(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatBRL(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
