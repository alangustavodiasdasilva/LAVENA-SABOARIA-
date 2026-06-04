import Image from "next/image";
import ProductGrid from "./components/ProductGrid";
import Carousel from "./components/Carousel";
import KitShowcase from "./components/KitShowcase";
import { getProducts, getSettings, getCategories, getActiveKits } from "./actions";
import { Leaf, Droplets, Flower2, Rabbit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const [products, settings, categories, kits] = await Promise.all([
    getProducts(),
    getSettings(),
    getCategories(),
    getActiveKits(),
  ]);

  const fallbackLogo = settings?.heroImageUrl || "/images/logo-lavena.png";
  const rawImages = [fallbackLogo, ...(settings?.heroImages || [])];
  const rawLinks = [settings?.heroImageUrlLink || "", ...(settings?.heroImageLinks || [])];

  const heroImages: string[] = [];
  const heroLinks: string[] = [];

  rawImages.forEach((img, idx) => {
    if (img && !heroImages.includes(img)) {
      heroImages.push(img);
      heroLinks.push(rawLinks[idx] || "");
    }
  });

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-logo-wrap">
            {heroImages.length > 1 ? (
              <Carousel
                images={heroImages}
                links={heroLinks}
                alt="Lavena Saboaria Artesanal"
                autoPlay
                intervalMs={4500}
                rounded
                priority
                sizes="(max-width: 768px) 92vw, 900px"
                fit="contain"
                showArrows={false}
              />
            ) : (
              heroLinks[0] ? (
                <a href={heroLinks[0]} className="hero-logo-link hero-logo-link-block" title="Ver produto">
                  <Image
                    src={heroImages[0]}
                    alt="Lavena Saboaria Artesanal"
                    width={900}
                    height={680}
                    priority
                    sizes="(max-width: 768px) 92vw, 900px"
                    className="hero-logo-image"
                    unoptimized={heroImages[0]?.startsWith("data:")}
                  />
                </a>
              ) : (
                <Image
                  src={heroImages[0]}
                  alt="Lavena Saboaria Artesanal"
                  width={900}
                  height={680}
                  priority
                  sizes="(max-width: 768px) 92vw, 900px"
                  className="hero-logo-image"
                  unoptimized={heroImages[0]?.startsWith("data:")}
                />
              )
            )}
          </div>
          <p className="hero-tagline">
            Criamos experiências que <em>cuidam de você</em>
          </p>
          <div className="hero-badges">
            <span className="hero-badge"><span className="hero-badge-dot"></span>Feito à mão</span>
            <span className="hero-badge"><span className="hero-badge-dot"></span>Natural</span>
            <span className="hero-badge"><span className="hero-badge-dot"></span>Delicado</span>
          </div>
          <div className="hero-cta">
            <a href={kits.some(k => k.isActive) ? "#kits" : "#produtos"} className="btn btn-gold btn-lg">Explorar Produtos</a>
          </div>
        </div>
      </section>

      {/* ═══ KITS ═══ */}
      {kits.length > 0 && <KitShowcase kits={kits as any} products={products as any} />}

      {/* ═══ PRODUCTS ═══ */}
      <section id="produtos" className="section">
        <div className="container">
          <ProductGrid 
            products={products.filter(p => p.isVisible !== false)} 
            categories={categories}
          />
        </div>
      </section>

      {/* ═══ ABOUT / BANNER ═══ */}
      <section id="sobre" className="banner-section">
        <div className="container banner-inner">
          <p className="section-label">Sobre a Lavena</p>
          <h2 className="banner-title">Sinta a pureza. Viva Lavena.</h2>
          <p className="banner-text">
            Cada detalhe é pensado para transmitir pureza, carinho e conexão com você — da espuma suave ao perfume delicado que envolve a pele.
            Nossos produtos são feitos à mão com ingredientes naturais selecionados.
          </p>
          <p className="banner-highlight">♡ Beleza que vem da natureza, para você.</p>

          <div className="trust-badges">
            <div className="trust-badge">
              <div className="trust-badge-icon trust-badge-green"><Leaf strokeWidth={1.5} size={28} /></div>
              <span className="trust-badge-text">Base Vegetal</span>
            </div>
            <div className="trust-badge">
              <div className="trust-badge-icon trust-badge-blue"><Droplets strokeWidth={1.5} size={28} /></div>
              <span className="trust-badge-text">Hidratante</span>
            </div>
            <div className="trust-badge">
              <div className="trust-badge-icon trust-badge-rose"><Flower2 strokeWidth={1.5} size={28} /></div>
              <span className="trust-badge-text">Aromas Naturais</span>
            </div>
            <div className="trust-badge">
              <div className="trust-badge-icon trust-badge-purple"><Rabbit strokeWidth={1.5} size={28} /></div>
              <span className="trust-badge-text">Cruelty Free</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
