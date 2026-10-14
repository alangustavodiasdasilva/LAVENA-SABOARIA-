import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { EmptyBlock, OrderStatusBadge, PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminOrders } from "@/lib/admin-data";
import { DELIVERY_LABEL, ORDER_STATUS_LABEL } from "@/lib/labels";
import { formatBRL, formatDateTime, formatPhone } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedidos" };

type Params = { status?: string; q?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePageAdmin();
  const sp = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(sp.status || "") ? (sp.status as OrderStatus) : "ALL";
  const q = (sp.q || "").slice(0, 60);

  // contagens por status (sem o filtro de status) para os chips
  const all = await getAdminOrders({ q, take: 500 });
  const counts: Record<string, number> = { ALL: all.length };
  for (const o of all) counts[o.status] = (counts[o.status] || 0) + 1;
  const orders = status === "ALL" ? all : all.filter((o) => o.status === status);

  const href = (s: string) => {
    const p = new URLSearchParams();
    if (s !== "ALL") p.set("status", s);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
  };

  return (
    <>
      <PageHeader title="Pedidos" subtitle="Pedidos feitos pelos clientes no site. Confirme, acompanhe e dê baixa no estoque." />

      <form className="toolbar" action="/admin/pedidos" role="search">
        {status !== "ALL" && <input type="hidden" name="status" value={status} />}
        <div className="search-field">
          <Search size={17} aria-hidden />
          <input className="input" type="search" name="q" defaultValue={q} placeholder="Buscar por nome, telefone ou nº do pedido" aria-label="Buscar pedidos" />
        </div>
        <button className="btn btn-outline" type="submit">
          Buscar
        </button>
      </form>

      <div className="chip-row" role="group" aria-label="Filtrar por status">
        {(["ALL", ...ORDER_STATUSES] as const).map((s) => (
          <Link key={s} href={href(s)} className={`chip ${status === s ? "is-active" : ""}`} aria-current={status === s ? "true" : undefined}>
            {s === "ALL" ? "Todos" : ORDER_STATUS_LABEL[s]} <span className="count">{counts[s] || 0}</span>
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyBlock icon={<ClipboardList size={26} />} title={q || status !== "ALL" ? "Nenhum pedido encontrado" : "Ainda não há pedidos"}>
          {q || status !== "ALL" ? "Tente outro filtro ou limpe a busca." : "Quando um cliente finalizar uma compra no site, o pedido aparece aqui."}
        </EmptyBlock>
      ) : (
        <>
          <div className="card table-card hide-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Entrega</th>
                  <th className="num">Total</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/pedidos/${o.id}`} className="row-link">
                        <strong>{o.code}</strong>
                      </Link>
                      <small>{formatDateTime(o.createdAt)}</small>
                    </td>
                    <td>
                      {o.customerName}
                      {o.customerPhone && <small>{formatPhone(o.customerPhone)}</small>}
                    </td>
                    <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td>{DELIVERY_LABEL[o.deliveryMethod]}</td>
                    <td className="num">{formatBRL(o.total)}</td>
                    <td>{o.paid ? <span className="badge badge-success">Pago</span> : <span className="badge badge-warn">Pendente</span>}</td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="card-list hide-desktop">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="list-card card">
                  <div className="list-card-top">
                    <strong>{o.code}</strong>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <span className="list-card-name">{o.customerName}</span>
                  <div className="list-card-bottom">
                    <small>{formatDateTime(o.createdAt)}</small>
                    <span>
                      {o.paid ? <span className="badge badge-success">Pago</span> : <span className="badge badge-warn">Pendente</span>} <b>{formatBRL(o.total)}</b>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
