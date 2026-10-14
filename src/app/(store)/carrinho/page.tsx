import type { Metadata } from "next";
import "@/styles/cart.css";
import CartView from "@/components/store/cart-view";
import { getPublicSettings, safe } from "@/lib/data";
import { FALLBACK_SETTINGS } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minha sacola",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const { data: settings } = await safe(getPublicSettings, FALLBACK_SETTINGS);
  return (
    <div className="container page-top cart-page">
      <header className="page-head">
        <span className="eyebrow">Finalização</span>
        <h1>
          Sua <span className="title-accent">sacola</span>
        </h1>
      </header>
      <CartView whatsappNumber={settings.whatsappNumber} deliveryInfo={settings.deliveryInfo} />
    </div>
  );
}
