import "@/styles/store.css";
import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/components/store/cart";
import Header from "@/components/store/header";
import Footer from "@/components/store/footer";
import FloatingCart from "@/components/store/floating-cart";
import { getPublicSettings, safe } from "@/lib/data";
import { FALLBACK_SETTINGS } from "@/lib/site";

const DEFAULT_ANNOUNCEMENT = "Feito à mão com carinho · Pedidos pelo WhatsApp · Frete a combinar";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { data: settings } = await safe(getPublicSettings, FALLBACK_SETTINGS);
  return (
    <ToastProvider>
      <CartProvider>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <div className="announce" role="note">
          <p>{settings.announcement || DEFAULT_ANNOUNCEMENT}</p>
        </div>
        <Header whatsappNumber={settings.whatsappNumber} instagramUrl={settings.instagramUrl} />
        <main id="conteudo">{children}</main>
        <Footer whatsappNumber={settings.whatsappNumber} instagramUrl={settings.instagramUrl} />
        <FloatingCart />
      </CartProvider>
    </ToastProvider>
  );
}
