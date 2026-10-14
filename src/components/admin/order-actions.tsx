"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, PackageCheck, Printer, Trash2, XCircle } from "lucide-react";
import { deleteOrder, saveOrderNotes, setOrderPaid, setOrderStatus } from "@/actions/orders";
import { useConfirm } from "@/components/ui/confirm";
import { useRun } from "@/components/admin/use-run";
import { ORDER_STATUS_LABEL } from "@/lib/labels";
import type { OrderStatus } from "@/lib/types";

export default function OrderActions({
  id,
  code,
  status,
  paid,
  stockDeducted,
  adminNotes,
  hasStockItems,
}: {
  id: string;
  code: string;
  status: OrderStatus;
  paid: boolean;
  stockDeducted: boolean;
  adminNotes: string;
  hasStockItems: boolean;
}) {
  const { run, busy } = useRun();
  const confirm = useConfirm();
  const router = useRouter();
  const [notes, setNotes] = useState(adminNotes);
  const [deduct, setDeduct] = useState(true);

  const needsDeductChoice = hasStockItems && !stockDeducted && status !== "CANCELED";

  const change = async (next: OrderStatus) => {
    if (next === "CANCELED") {
      const ok = await confirm({
        title: "Cancelar este pedido?",
        message: stockDeducted ? "Os produtos já descontados voltam para o estoque." : "O pedido fica marcado como cancelado.",
        confirmLabel: "Cancelar pedido",
        cancelLabel: "Voltar",
        tone: "danger",
      });
      if (!ok) return;
    }
    const withDeduct = needsDeductChoice && deduct && (next === "CONFIRMED" || next === "DELIVERED");
    await run(() => setOrderStatus(id, next, withDeduct), {
      success: next === "CANCELED" ? "Pedido cancelado." : `Pedido marcado como ${ORDER_STATUS_LABEL[next].toLowerCase()}.`,
    });
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Excluir o pedido ${code}?`,
      message: "Isso apaga o pedido de vez. Se o estoque tinha sido descontado, ele é devolvido.",
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    await run(() => deleteOrder(id), { success: "Pedido excluído.", refresh: false, onDone: () => router.replace("/admin/pedidos") });
  };

  return (
    <aside className="stack no-print">
      <section className="card panel">
        <div className="panel-head">
          <h2>Andamento</h2>
        </div>

        {needsDeductChoice && (
          <label className="check deduct">
            <input type="checkbox" checked={deduct} onChange={(e) => setDeduct(e.target.checked)} />
            <span>Descontar do estoque ao confirmar</span>
          </label>
        )}
        {stockDeducted && (
          <p className="soft small">
            <PackageCheck size={15} className="inline-icon" /> Estoque já descontado neste pedido.
          </p>
        )}

        <div className="action-stack">
          {status === "NEW" && (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => change("CONFIRMED")}>
              <Check size={17} /> Confirmar pedido
            </button>
          )}
          {status === "CONFIRMED" && (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => change("DELIVERED")}>
              <PackageCheck size={17} /> Marcar como entregue
            </button>
          )}
          {(status === "DELIVERED" || status === "CANCELED") && (
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => change("NEW")}>
              Reabrir pedido
            </button>
          )}
          {status !== "CANCELED" && status !== "NEW" && (
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => change("NEW")}>
              Voltar para “novo”
            </button>
          )}
          {status !== "CANCELED" && (
            <button type="button" className="btn btn-ghost btn-danger-text" disabled={busy} onClick={() => change("CANCELED")}>
              <XCircle size={17} /> Cancelar pedido
            </button>
          )}
        </div>

        <label className="check pay">
          <input type="checkbox" checked={paid} disabled={busy} onChange={(e) => run(() => setOrderPaid(id, e.target.checked), { success: e.target.checked ? "Marcado como pago." : "Marcado como pendente." })} />
          <span>Pagamento recebido</span>
        </label>
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>Anotações internas</h2>
        </div>
        <div className="field">
          <label htmlFor="admin-notes" className="sr-only">
            Anotações internas
          </label>
          <textarea id="admin-notes" className="textarea" rows={4} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Só você vê isto. Ex.: combinado retirar na sexta." />
        </div>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy || notes === adminNotes} onClick={() => run(() => saveOrderNotes(id, notes), { success: "Anotação salva." })}>
          Salvar anotação
        </button>
      </section>

      <div className="action-row">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir
        </button>
        <button type="button" className="btn btn-ghost btn-sm btn-danger-text" disabled={busy} onClick={remove}>
          <Trash2 size={16} /> Excluir pedido
        </button>
      </div>
    </aside>
  );
}
