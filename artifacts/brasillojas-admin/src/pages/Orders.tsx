import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Printer, ChevronRight, Eye, Check, X, BadgeDollarSign } from "lucide-react";
import { useListAllOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import type { Order } from "@workspace/api-client-react";
import { formatBRL, formatDate } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  cancelado: "Cancelado",
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
  cancelado: "bg-red-100 text-red-800",
  criando: "bg-orange-100 text-orange-800",
  processando: "bg-purple-100 text-purple-800",
  saiu_para_entrega: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
};

const paymentLabel: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão na Loja",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  boleto: "Boleto Bancário",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  criando: "Mover para: Em processamento",
  processando: "Mover para: Saiu para entrega",
};

type OrderWithCustomer = Order;

function escHtml(str: string | null | undefined): string {
  if (!str) return "—";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildReportHtml(orders: OrderWithCustomer[]): string {
  const now = new Date().toLocaleString("pt-BR");

  const rows = orders
    .map((order) => {
      const addr = order.shippingAddress;
      const addressStr = addr
        ? `${escHtml(addr.street)}, ${escHtml(addr.number)}${addr.complement ? " " + escHtml(addr.complement) : ""} – ${escHtml(addr.neighborhood)}, ${escHtml(addr.city)}/${escHtml(addr.state)} – ${escHtml(addr.zipCode)}`
        : "—";
      const itemsList = order.items
        .map((it) => `${escHtml(it.name)} (${it.quantity}x ${formatBRL(it.price)})`)
        .join("<br/>");
      const discountStr =
        order.discount > 0 ? `-${formatBRL(order.discount)}` : "—";
      const customerName = escHtml(order.customerName) !== "—"
        ? escHtml(order.customerName)
        : escHtml(order.userId);
      const customerEmail = order.customerEmail ? `<br/><span style="color:#555;font-size:10px">${escHtml(order.customerEmail)}</span>` : "";

      return `
        <tr>
          <td>#${order.id}</td>
          <td>${escHtml(formatDate(order.createdAt))}</td>
          <td>${customerName}${customerEmail}</td>
          <td style="font-size:11px">${itemsList}</td>
          <td>${escHtml(order.paymentMethod ? (paymentLabel[order.paymentMethod] ?? order.paymentMethod) : "—")}</td>
          <td>${discountStr}</td>
          <td><strong>${formatBRL(order.total)}</strong></td>
          <td style="font-size:11px">${addressStr}</td>
        </tr>`;
    })
    .join("");

  const totalVendas = orders.reduce((s, o) => s + o.total, 0);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório de Vendas – BrasilLojas</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #222; padding: 16px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .meta { color: #555; font-size: 11px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1B5E20; color: #fff; text-align: left; padding: 6px 8px; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .footer { margin-top: 16px; font-size: 11px; color: #555; border-top: 1px solid #ccc; padding-top: 8px; display: flex; justify-content: space-between; }
  @media print {
    @page { size: A4 landscape; margin: 10mm; }
    body { padding: 0; }
  }
</style>
</head>
<body>
<h1>BrasilLojas – Relatório de Vendas</h1>
<p class="meta">Gerado em: ${escHtml(now)} &nbsp;|&nbsp; Total de pedidos: ${orders.length}</p>
<table>
  <thead>
    <tr>
      <th>Pedido</th>
      <th>Data</th>
      <th>Cliente</th>
      <th>Itens</th>
      <th>Pagamento</th>
      <th>Desconto</th>
      <th>Total</th>
      <th>Endereço de Entrega</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">
  <span>BrasilLojas Comércio Ltda</span>
  <span>Total geral: <strong>${formatBRL(totalVendas)}</strong></span>
</div>
</body>
</html>`;
}

function buildReceiptHtml(order: OrderWithCustomer): string {
  const now = new Date().toLocaleString("pt-BR");
  const addr = order.shippingAddress;
  const addressStr = addr
    ? `${escHtml(addr.street)}, ${escHtml(addr.number)}${addr.complement ? " " + escHtml(addr.complement) : ""}<br/>${escHtml(addr.neighborhood)} – ${escHtml(addr.city)}/${escHtml(addr.state)}<br/>CEP: ${escHtml(addr.zipCode)}`
    : "Retirada na Loja";
  const itemsRows = order.items.map((it) =>
    `<tr><td>${escHtml(it.name)}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${formatBRL(it.price)}</td><td style="text-align:right">${formatBRL(it.price * it.quantity)}</td></tr>`
  ).join("");
  const paymentStatus = order.paymentStatus === "paid" ? "PAGO" : "AGUARDANDO PAGAMENTO";
  const customer = order.customerName ?? order.userId;

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

function AdvanceStatusButton({ order }: { order: OrderWithCustomer }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUpdateOrderStatus();
  const [error, setError] = useState<string | null>(null);

  const nextLabel = NEXT_STATUS_LABEL[order.status];
  if (!nextLabel) return null;

  function handleAdvance() {
    setError(null);
    mutate(
      { id: order.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/orders/all"] });
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : "Erro ao atualizar status");
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleAdvance}
        disabled={isPending}
        className="flex items-center gap-1 text-xs bg-[#1B5E20] hover:bg-[#2E7D32] disabled:opacity-60 text-white px-2.5 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap"
      >
        <ChevronRight size={12} />
        {isPending ? "Atualizando..." : nextLabel}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function OrderActionButtons({ order }: { order: OrderWithCustomer }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDone = order.status === "entregue" || order.status === "cancelado";
  if (isDone) return null;

  async function callAction(action: "confirm-payment" | "cancel") {
    setLoading(action);
    setError(null);
    try {
      const token = await getToken();
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const response = await fetch(`${base}/api/orders/${order.id}/${action}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Erro ao atualizar pedido");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/orders/all"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-1 mt-1">
      {order.paymentStatus !== "paid" && (
        <button
          onClick={() => callAction("confirm-payment")}
          disabled={loading !== null}
          title="Confirmar que o pagamento foi recebido"
          className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-2.5 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap"
        >
          <BadgeDollarSign size={12} />
          {loading === "confirm-payment" ? "Confirmando..." : "Confirmar Pagamento"}
        </button>
      )}
      {order.paymentStatus === "paid" && (
        <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold px-2 py-1">
          <Check size={11} /> Pago
        </span>
      )}
      <button
        onClick={() => {
          if (!confirm(`Cancelar o pedido #${order.id}? O cliente poderá ver que foi cancelado.`)) return;
          callAction("cancel");
        }}
        disabled={loading !== null}
        title="Cancelar este pedido"
        className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-2.5 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap"
      >
        <X size={12} />
        {loading === "cancel" ? "Cancelando..." : "Cancelar Pedido"}
      </button>
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useListAllOrders();
  const typedOrders = (orders ?? []) as OrderWithCustomer[];
  const [, setLocation] = useLocation();

  function handlePrintReceipt(order: OrderWithCustomer) {
    const html = buildReceiptHtml(order);
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  function handlePrintReport() {
    if (!typedOrders.length) return;
    const html = buildReportHtml(typedOrders);
    const win = window.open("", "_blank", "width=1100,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        {!!typedOrders.length && (
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            <Printer size={16} />
            Imprimir Vendas
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : !typedOrders.length ? (
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
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Itens</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Pagamento</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {typedOrders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/orders/${order.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">#{order.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="font-medium">{order.customerName ?? order.userId}</div>
                      {order.customerEmail && (
                        <div className="text-xs text-gray-400">{order.customerEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.items.map((it, j) => (
                        <div key={j}>{it.name} <span className="text-gray-400">×{it.quantity}</span></div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{order.paymentMethod ? (paymentLabel[order.paymentMethod] ?? order.paymentMethod) : "—"}</div>
                      {order.paymentStatus === "paid" && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                          <Check size={10} /> Pago
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatBRL(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLocation(`/orders/${order.id}`)}
                            title="Ver detalhes"
                            className="p-1.5 text-gray-500 hover:text-[#1B5E20] hover:bg-green-50 rounded transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            title="Imprimir Comprovante"
                            className="p-1.5 text-gray-500 hover:text-[#1B5E20] hover:bg-green-50 rounded transition-colors"
                          >
                            <Printer size={15} />
                          </button>
                          <AdvanceStatusButton order={order} />
                        </div>
                        <OrderActionButtons order={order} />
                      </div>
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
