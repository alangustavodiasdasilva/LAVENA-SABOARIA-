import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gift, MapPin, MessageCircle, Phone, StickyNote } from "lucide-react";
import OrderActions from "@/components/admin/order-actions";
import { OrderStatusBadge, PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminOrder } from "@/lib/admin-data";
import { DELIVERY_LABEL } from "@/lib/labels";
import { formatBRL, formatDateTime, formatPhone, normalizeWhatsapp } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedido" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAdmin();
  const { id } = await params;
  const order = await getAdminOrder(id).catch(() => null);
  if (!order) notFound();

  const phone = order.customerPhone ? normalizeWhatsapp(order.customerPhone) : "";
  const reply = phone
    ? whatsappLink(phone, `Olá, ${order.customerName.split(" ")[0]}! Aqui é da Lavena 🌿 Sobre o seu pedido ${order.code}:`)
    : null;
  const products = order.items.filter((i) => i.kind !== "bag");
  const bags = order.items.filter((i) => i.kind === "bag");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/pedidos", label: "Pedidos" }}
        title={`Pedido ${order.code}`}
        subtitle={
          <>
            Feito em {formatDateTime(order.createdAt)} · {order.type === "GIFT" ? "Sacola presente" : "Compra pelo carrinho"}
          </>
        }
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="detail-grid">
        <div className="stack">
          <section className="card panel printable">
            <div className="panel-head">
              <h2>Itens do pedido</h2>
            </div>
            <ul className="line-list">
              {[...products, ...bags].map((it, i) => (
                <li key={i}>
                  <div>
                    <strong>{it.name}</strong>
                    <small>
                      {it.quantity} × {formatBRL(it.unitPrice)}
                      {it.reserve ? " · sob encomenda" : ""}
                      {it.kind === "bag" ? " · sacola" : ""}
                    </small>
                  </div>
                  <b>{formatBRL(it.quantity * it.unitPrice)}</b>
                </li>
              ))}
            </ul>
            <div className="line-total">
              <span>Total</span>
              <strong>{formatBRL(order.total)}</strong>
            </div>
          </section>

          <section className="card panel">
            <div className="panel-head">
              <h2>Cliente e entrega</h2>
            </div>
            <dl className="facts">
              <div>
                <dt>Nome</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt>
                  <Phone size={14} /> Telefone
                </dt>
                <dd>{order.customerPhone ? formatPhone(order.customerPhone) : "Não informado"}</dd>
              </div>
              <div>
                <dt>
                  <MapPin size={14} /> Entrega
                </dt>
                <dd>
                  {DELIVERY_LABEL[order.deliveryMethod]}
                  {order.address && <span className="block">{order.address}</span>}
                </dd>
              </div>
              {order.recipientName && (
                <div>
                  <dt>
                    <Gift size={14} /> Presente para
                  </dt>
                  <dd>{order.recipientName}</dd>
                </div>
              )}
              {order.cardMessage && (
                <div>
                  <dt>Mensagem do cartão</dt>
                  <dd className="quote">“{order.cardMessage}”</dd>
                </div>
              )}
              {order.notes && (
                <div>
                  <dt>
                    <StickyNote size={14} /> Observação do cliente
                  </dt>
                  <dd>{order.notes}</dd>
                </div>
              )}
            </dl>
            {reply && (
              <a href={reply} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <MessageCircle size={18} /> Conversar no WhatsApp
              </a>
            )}
          </section>
        </div>

        <OrderActions
          id={order.id}
          code={order.code}
          status={order.status}
          paid={order.paid}
          stockDeducted={order.stockDeducted}
          adminNotes={order.adminNotes || ""}
          hasStockItems={products.length > 0}
        />
      </div>
    </>
  );
}
