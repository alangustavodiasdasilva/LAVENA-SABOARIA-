"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Calculator,
  ClipboardList,
  ExternalLink,
  Gift,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  X,
} from "lucide-react";
import { logout } from "@/actions/auth";
import Wordmark from "@/components/store/wordmark";

const NAV = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/kits", label: "Kits", icon: Gift },
  { href: "/admin/sacolas", label: "Sacolas de presente", icon: ShoppingBag },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/precificacao", label: "Precificação", icon: Calculator },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

const TABS = ["/admin", "/admin/pedidos", "/admin/produtos", "/admin/estoque"];

export default function AdminShell({ children, newOrders, weakPassword }: { children: React.ReactNode; newOrders: number; weakPassword: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [more, setMore] = useState(false);
  const [leaving, startLeave] = useTransition();

  useEffect(() => setMore(false), [pathname]);

  const active = (item: (typeof NAV)[number]) => ("exact" in item && item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));
  const current = NAV.find(active);

  const leave = () =>
    startLeave(async () => {
      await logout();
      router.replace("/admin/login");
      router.refresh();
    });

  const NavLink = ({ item }: { item: (typeof NAV)[number] }) => {
    const Icon = item.icon;
    return (
      <Link href={item.href} className={`snav ${active(item) ? "is-active" : ""}`} aria-current={active(item) ? "page" : undefined}>
        <Icon size={19} strokeWidth={1.6} />
        <span>{item.label}</span>
        {item.href === "/admin/pedidos" && newOrders > 0 && <span className="snav-badge">{newOrders}</span>}
      </Link>
    );
  };

  return (
    <div className="shell">
      <aside className="sidebar hide-mobile">
        <div className="sidebar-brand">
          <Wordmark light />
          <span className="sidebar-tag">Painel da loja</span>
        </div>
        <nav className="sidebar-nav" aria-label="Painel">
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="sidebar-foot">
          <Link href="/" className="snav" target="_blank">
            <ExternalLink size={18} strokeWidth={1.6} /> <span>Ver a loja</span>
          </Link>
          <button type="button" className="snav" onClick={leave} disabled={leaving}>
            <LogOut size={18} strokeWidth={1.6} /> <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar hide-desktop">
          <Wordmark />
          <span className="topbar-title">{current?.label}</span>
          <Link href="/" target="_blank" className="header-icon-btn" aria-label="Ver a loja">
            <ExternalLink size={20} />
          </Link>
        </header>

        {weakPassword && (
          <div className="admin-banner" role="alert">
            <KeyRound size={18} />
            <p>
              Você ainda usa a <strong>senha padrão</strong>. Crie uma senha só sua para proteger a loja.
            </p>
            <Link href="/admin/configuracoes#seguranca" className="btn btn-sm btn-gold">
              Trocar senha
            </Link>
          </div>
        )}

        <main className="shell-content">{children}</main>
      </div>

      <nav className="tabbar hide-desktop" aria-label="Painel">
        {NAV.filter((n) => TABS.includes(n.href)).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`tab ${active(item) ? "is-active" : ""}`} aria-current={active(item) ? "page" : undefined}>
              <span className="tab-icon">
                <Icon size={22} strokeWidth={1.6} />
                {item.href === "/admin/pedidos" && newOrders > 0 && <span className="snav-badge is-dot">{newOrders}</span>}
              </span>
              {item.label}
            </Link>
          );
        })}
        <button type="button" className={`tab ${more ? "is-active" : ""}`} onClick={() => setMore(true)} aria-expanded={more} aria-haspopup="dialog">
          <span className="tab-icon">
            <MoreHorizontal size={22} strokeWidth={1.6} />
          </span>
          Mais
        </button>
      </nav>

      {more && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setMore(false)}>
          <div className="dialog more-sheet" role="dialog" aria-modal="true" aria-label="Mais opções">
            <div className="more-head">
              <h3>Mais opções</h3>
              <button type="button" className="header-icon-btn" onClick={() => setMore(false)} aria-label="Fechar">
                <X size={22} />
              </button>
            </div>
            <div className="more-grid">
              {NAV.filter((n) => !TABS.includes(n.href)).map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={`more-item ${active(item) ? "is-active" : ""}`}>
                    <Icon size={22} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                );
              })}
              <button type="button" className="more-item" onClick={leave}>
                <LogOut size={22} strokeWidth={1.5} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
