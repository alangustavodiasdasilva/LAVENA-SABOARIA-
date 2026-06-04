import "./globals.css";
import type { Metadata, Viewport } from "next";
import { CartProvider } from "./components/CartContext";
import Header from "./components/Header";
import FloatingCart from "./components/FloatingCart";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F7F3EE",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "Lavena | Saboaria Artesanal",
  description:
    "Beleza que vem da natureza, para você. Sabonetes artesanais feitos à mão com ingredientes naturais. Sinta a pureza. Viva Lavena.",
  icons: {
    icon: "/favicon.ico",
    apple: "/images/logo-lavena.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Lavena",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <FloatingCart />
          <footer className="footer">
            <div className="container footer-inner">
              <div className="footer-top">
                <div className="footer-brand">
                  <p className="footer-logo">Lavena<span className="logo-dot">.</span></p>
                  <p className="footer-slogan">Beleza que vem da natureza ♡</p>
                </div>
                <nav className="footer-nav">
                  <a href="/#produtos">Produtos</a>
                  <a href="/#sobre">Sobre</a>
                  <a href="/presente">Monte um presente</a>
                  <a href="/carrinho">Carrinho</a>
                </nav>
              </div>
              <hr className="footer-divider" />
              <p className="footer-copy">
                &copy; {new Date().getFullYear()} Lavena Saboaria Artesanal. Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
