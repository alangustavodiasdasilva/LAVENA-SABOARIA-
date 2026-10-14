import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ClipboardList, Plus, TrendingUp, Wallet } from "lucide-react";
import { Checklist, EmptyBlock, OrderStatusBadge, PageHeader, StatCard } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getDashboardStats } from "@/lib/admin-data";
import { formatBRL, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  await requirePageAdmin();
  const s = await getDashboardStats();

  const setup = [
    { done: s.setup.hasWhatsapp, title: "Configure o WhatsApp da loja", text: "É para ele que os pedidos dos clientes são enviados.", href: "/admin/configuracoes", cta: "Configurar" },
    { done: s.setup.hasCategories, title: "Crie as categorias", text: "Ex.: Sabonetes, Sabonete líquido, Geleia de banho, Mousse de banho.", href: "/admin/categorias", cta: "Criar" },
    { done: s.setup.hasProducts, title: "Cadastre os produtos", text: "Adicione fotos, preços e descrições. Eles aparecem na loja na hora.", href: "/admin/produtos/novo", cta: "Cadastrar" },
    { done: s.setup.hasHero, title: "Escolha as imagens do topo do site", text: "Sem isso, o site mostra a arte padrão da Lavena.", href: "/admin/configuracoes#topo", cta: "Escolher" },
    { done: s.setup.passwordChanged, title: "Troque a senha padrão", text: "Crie uma senha só sua para proteger o painel.", href: "/admin/configuracoes#seguranca", cta: "Trocar" },
    {
      done: s.setup.storageConfigured,
      title: "Ative o armazenamento de fotos",
      text: "Defina SUPABASE_SERVICE_ROLE_KEY na hospedagem. Sem isso as fotos ficam guardadas dentro do banco, o que deixa o site mais pesado.",
    },
  ];
  const doneCount = setup.filter((x) => x.done).length;
  const maxDay = Math.max(1, ...s.salesByDay.map((d) => d.total));

  return (
    <>
      <PageHeader
        title="Olá! Veja como está a loja"
        subtitle="Um resumo dos pedidos, das vendas e do que precisa de atenção."
        actions={
          <>
            <Link href="/admin/pedidos" className="btn btn-outline">
              <ClipboardList size={17} /> Pedidos
            </Link>
            <Link href="/admin/produtos/novo" className="btn btn-primary">
              <Plus size={17} /> Novo produto
            </Link>
          </>
        }
      />

      {doneCount < setup.length && <Checklist items={setup} doneCount={doneCount} />}

      <div className="stats">
        <StatCard
          icon={<ClipboardList size={22} />}
          label="Pedidos novos"
          value={s.newOrders}
          hint={s.newOrders > 0 ? "Aguardando confirmação" : "Tudo em dia"}
          tone="blue"
          href="/admin/pedidos?status=NEW"
        />
        <StatCard icon={<TrendingUp size={22} />} label="Vendas em 30 dias" value={formatBRL(s.revenueLast30)} hint={`${s.ordersLast30} ${s.ordersLast30 === 1 ? "pedido" : "pedidos"}`} tone="sage" />
        <StatCard icon={<Wallet size={22} />} label="A receber" value={formatBRL(s.pendingPaymentTotal)} hint={`${s.pendingPaymentCount} ${s.pendingPaymentCount === 1 ? "pedido" : "pedidos"} sem pagamento`} tone="gold" href="/admin/pedidos" />
        <StatCard icon={<AlertTriangle size={22} />} label="Atenção no estoque" value={s.lowStock.length + s.outOfStock} hint={`${s.lowStock.length} baixo · ${s.outOfStock} esgotado`} tone="rose" href="/admin/estoque" />
      </div>

      <div className="dash-grid">
        <section className="card panel dash-chart" aria-labelledby="chart-title">
          <div className="panel-head">
            <h2 id="chart-title">Vendas dos últimos 14 dias</h2>
            <span className="soft">Ticket médio {formatBRL(s.avgTicket)}</span>
          </div>
          <div className="bars" role="img" aria-label="Gráfico de vendas por dia">
            {s.salesByDay.map((d, i) => (
              <div key={d.date} className="bar-col" title={`${d.label}: ${formatBRL(d.total)} (${d.count} ${d.count === 1 ? "pedido" : "pedidos"})`}>
                <div className="bar-track">
                  <div className="bar" style={{ height: `${Math.max(d.total > 0 ? 6 : 0, (d.total / maxDay) * 100)}%` }} />
                </div>
                <span className="bar-label">{i % 2 === 0 || i === s.salesByDay.length - 1 ? d.label : ""}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card panel" aria-labelledby="low-title">
          <div className="panel-head">
            <h2 id="low-title">Estoque baixo</h2>
            <Link href="/admin/estoque" className="panel-link">
              Ver estoque
            </Link>
          </div>
          {s.lowStock.length === 0 ? (
            <p className="panel-empty">Nenhum produto com estoque baixo. 🌿</p>
          ) : (
            <ul className="mini-list">
              {s.lowStock.map((l, i) => (
                <li key={`${l.productId}-${i}`}>
                  <Link href={`/admin/produtos/${l.productId}`}>
                    {l.name}
                    {l.label ? <small> · {l.label}</small> : null}
                  </Link>
                  <span className="badge badge-warn">{l.quantity} {l.quantity === 1 ? "un." : "un."}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card panel dash-orders" aria-labelledby="recent-title">
          <div className="panel-head">
            <h2 id="recent-title">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="panel-link">
              Ver todos
            </Link>
          </div>
          {s.recentOrders.length === 0 ? (
            <EmptyBlock title="Nenhum pedido ainda">Quando um cliente finalizar uma compra, o pedido aparece aqui.</EmptyBlock>
          ) : (
            <ul className="order-list">
              {s.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="order-row">
                    <span className="order-code">{o.code}</span>
                    <span className="order-who">
                      <strong>{o.customerName}</strong>
                      <small>{timeAgo(o.createdAt)}{o.type === "GIFT" ? " · Presente" : ""}</small>
                    </span>
                    <span className="order-total">{formatBRL(o.total)}</span>
                    <OrderStatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card panel" aria-labelledby="top-title">
          <div className="panel-head">
            <h2 id="top-title">Mais pedidos (30 dias)</h2>
          </div>
          {s.topProducts.length === 0 ? (
            <p className="panel-empty">Ainda sem vendas no período.</p>
          ) : (
            <ol className="rank-list">
              {s.topProducts.map((t, i) => (
                <li key={t.name}>
                  <span className="rank-num">{i + 1}</span>
                  <span className="rank-name">{t.name}</span>
                  <span className="rank-qty">{t.quantity} un.</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
