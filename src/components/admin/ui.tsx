import Link from "next/link";
import { Check } from "lucide-react";
import { ORDER_STATUS_LABEL, STOCK_LABEL } from "@/lib/labels";
import type { OrderStatus, StockStatus } from "@/lib/types";

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="ph">
      <div>
        {back && (
          <Link href={back.href} className="ph-back">
            ← {back.label}
          </Link>
        )}
        <h1>{title}</h1>
        {subtitle && <p className="ph-sub">{subtitle}</p>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </header>
  );
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "sage",
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "sage" | "gold" | "rose" | "blue";
  href?: string;
}) {
  const body = (
    <>
      <span className={`stat-icon tone-${tone}`}>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="stat card is-link">
      {body}
    </Link>
  ) : (
    <div className="stat card">{body}</div>
  );
}

const ORDER_TONE: Record<OrderStatus, string> = {
  NEW: "badge-info",
  CONFIRMED: "badge-sage",
  DELIVERED: "badge-success",
  CANCELED: "badge-danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${ORDER_TONE[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

const STOCK_TONE: Record<StockStatus, string> = {
  IN_STOCK: "badge-success",
  IN_PRODUCTION: "badge-warn",
  OUT_OF_STOCK: "badge-danger",
};

export function StockBadge({ status }: { status: StockStatus }) {
  return <span className={`badge ${STOCK_TONE[status]}`}>{STOCK_LABEL[status]}</span>;
}

export function EmptyBlock({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="empty-block">
      {icon && <span className="empty-icon">{icon}</span>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Checklist({ items, doneCount }: { items: { done: boolean; title: string; text: string; href?: string; cta?: string }[]; doneCount: number }) {
  const pct = Math.round((doneCount / items.length) * 100);
  return (
    <section className="card setup" aria-labelledby="setup-title">
      <div className="setup-head">
        <div>
          <h2 id="setup-title">Primeiros passos</h2>
          <p className="soft">Deixe a loja pronta para receber pedidos.</p>
        </div>
        <div className="setup-progress" aria-label={`${pct}% concluído`}>
          <span>{pct}%</span>
          <div>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <ul className="setup-list">
        {items.map((it) => (
          <li key={it.title} className={it.done ? "is-done" : ""}>
            <span className="setup-check">{it.done ? <Check size={14} strokeWidth={3} /> : null}</span>
            <div>
              <strong>{it.title}</strong>
              <p>{it.text}</p>
            </div>
            {!it.done && it.href && (
              <Link href={it.href} className="btn btn-sm btn-outline">
                {it.cta || "Configurar"}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
