"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "./cart";
import Wordmark from "./wordmark";
import { InstagramIcon } from "@/components/ui/ornaments";

const NAV = [
  { href: "/loja", label: "Loja" },
  { href: "/presente", label: "Presentes" },
  { href: "/#historia", label: "Nossa história" },
  { href: "/#como-pedir", label: "Como pedir" },
];

export default function Header({ whatsappNumber, instagramUrl }: { whatsappNumber: string | null; instagramUrl: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, hydrated } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Links do menu do celular: fecha a gaveta ANTES de navegar. Com a gaveta aberta o scroll da página
  // fica travado (overflow hidden), então links de âncora (/#historia) não rolavam até a seção.
  const go = (e: React.MouseEvent, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setOpen(false);
    window.setTimeout(() => {
      const hash = href.includes("#") ? href.slice(href.indexOf("#") + 1) : "";
      const path = href.split("#")[0] || "/";
      if (hash && path === pathname) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `${path}#${hash}`);
      } else {
        router.push(href);
      }
    }, 60);
  };

  const isActive = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(href + "/"));

  const cartLabel = hydrated && count > 0 ? `Sacola, ${count} ${count === 1 ? "item" : "itens"}` : "Sacola";

  // A gaveta fica FORA do <header>: o header tem backdrop-filter, e isso faz um filho
  // com position: fixed ficar preso à altura do header (menu cortado no celular).
  return (
    <>
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container site-header-inner">
        <button type="button" className="header-icon-btn hide-desktop" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open}>
          <Menu size={24} />
        </button>

        <Wordmark />

        <nav className="header-nav hide-mobile" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={isActive(n.href) ? "is-active" : undefined} aria-current={isActive(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/presente" className="header-icon-btn hide-mobile" aria-label="Montar um presente" title="Montar um presente">
            <Gift size={21} />
          </Link>
          <Link href="/carrinho" className="header-icon-btn cart-btn" aria-label={cartLabel}>
            <ShoppingBag size={22} />
            {hydrated && count > 0 && <span className="cart-count">{count > 99 ? "99+" : count}</span>}
          </Link>
        </div>
      </div>
    </header>

      <div className={`drawer-overlay ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} aria-hidden />
      <aside className={`drawer ${open ? "is-open" : ""}`} aria-hidden={!open} aria-label="Menu" {...(open ? { role: "dialog", "aria-modal": true } : {})}>
        <div className="drawer-head">
          <Wordmark />
          <button type="button" className="header-icon-btn" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X size={24} />
          </button>
        </div>
        <nav className="drawer-nav" aria-label="Menu">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={(e) => go(e, n.href)} tabIndex={open ? 0 : -1}>
              {n.label}
            </Link>
          ))}
          <Link href="/carrinho" onClick={(e) => go(e, "/carrinho")} tabIndex={open ? 0 : -1}>
            Minha sacola{hydrated && count > 0 ? ` (${count})` : ""}
          </Link>
        </nav>
        <div className="drawer-foot">
          {whatsappNumber && (
            <a className="btn btn-whatsapp btn-block" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
              Falar no WhatsApp
            </a>
          )}
          {instagramUrl && (
            <a className="drawer-social" href={instagramUrl} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
              <InstagramIcon size={18} /> Instagram
            </a>
          )}
          <p className="script drawer-tag">Sinta a pureza. Viva Lavena.</p>
        </div>
      </aside>
    </>
  );
}
