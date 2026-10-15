import type { ThemeCopy } from "@/lib/theme-copy";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Droplets,
  Flower2,
  HandHeart,
  Leaf,
  MessageCircle,
  PackageCheck,
  Rabbit,
  Send,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import HeroCarousel from "./hero-carousel";
import { Heart, InstagramIcon, Sprig } from "@/components/ui/ornaments";
import type { CategoryDTO, HeroSlide } from "@/lib/types";

/* ─── Hero ─── */
export function Hero({ slides, copy }: { slides: HeroSlide[]; copy: ThemeCopy }) {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden />
      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">{copy.heroEyebrow}</span>
          <h1>
            {copy.heroTitle}
            <span className="hero-script title-accent">{copy.heroAccent}</span>
          </h1>
          <p className="hero-lead">{copy.heroLead}</p>
          <div className="hero-cta">
            <Link href="/loja" className="btn btn-primary btn-lg">
              {copy.heroCta} <ArrowRight size={18} />
            </Link>
            <Link href="/presente" className="btn btn-outline btn-lg">
              Montar um presente
            </Link>
          </div>
          <ul className="hero-chips" aria-label="Nossos valores">
            {copy.heroChips.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="hero-visual">
          <Sprig className="hero-sprig is-a" />
          <Sprig className="hero-sprig is-b" flip />
          <div className="hero-frame">
            <HeroCarousel slides={slides} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Faixa de confiança ─── */
const TRUST = [
  { icon: HandHeart, title: "Feito à mão com amor", text: "Cada peça preparada com carinho e atenção." },
  { icon: Leaf, title: "Ingredientes selecionados", text: "Base vegetal e matérias-primas escolhidas a dedo." },
  { icon: Droplets, title: "Fórmulas suaves", text: "Equilibradas para limpar sem ressecar a pele." },
  { icon: Rabbit, title: "Cruelty free", text: "Livre de parabenos e não testado em animais." },
];

export function TrustStrip() {
  return (
    <section className="trust" aria-label="Diferenciais da Lavena">
      <div className="container trust-grid">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div className="trust-item" key={title}>
            <span className="trust-icon">
              <Icon size={22} strokeWidth={1.5} />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Nossas linhas ─── */
const LINES = [
  {
    key: "glicerin",
    title: "Sabonetes glicerinados",
    text: "Limpeza suave, hidratação e aromas que transformam o seu dia.",
    image: "/brand/glicerinados.webp",
  },
  {
    key: "liquid",
    title: "Sabonete líquido",
    text: "Limpa, hidrata e perfuma a pele todos os dias.",
    image: "/brand/liquido.webp",
  },
  {
    key: "geleia",
    title: "Geleias de banho",
    text: "Textura única que transforma o banho em um momento de cuidado.",
    image: "/brand/geleia-maracuja.webp",
  },
  {
    key: "mousse",
    title: "Mousses de banho",
    text: "Textura cremosa e perfumada, com sensação de spa.",
    image: "/brand/mousse.webp",
  },
];

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function Lines({ categories }: { categories: CategoryDTO[] }) {
  const hrefFor = (key: string) => {
    const match = categories.find((c) => norm(c.name + " " + c.slug).includes(key));
    return match ? `/loja?categoria=${match.slug}` : "/loja";
  };
  return (
    <section className="section" id="linhas">
      <div className="container">
        <div className="section-head is-centered reveal">
          <span className="eyebrow is-centered">Nossas linhas</span>
          <h2>
            Cuidado em cada <span className="title-accent">detalhe</span>
          </h2>
          <p>Da espuma suave ao perfume delicado que envolve a pele: conheça o que a Lavena prepara para o seu autocuidado.</p>
        </div>
        <div className="lines-grid">
          {LINES.map((l) => (
            <Link key={l.key} href={hrefFor(l.key)} className="line-card reveal">
              <div className="line-media img-wrap">
                <Image src={l.image} alt="" fill sizes="(max-width: 720px) 50vw, 25vw" className="line-img" />
              </div>
              <div className="line-body">
                <h3>{l.title}</h3>
                <p>{l.text}</p>
                <span className="line-more">
                  Ver produtos <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Presentes ─── */
export function GiftsBand({ hasKits, copy }: { hasKits: boolean; copy: ThemeCopy }) {
  return (
    <section className="section section-alt gifts" id="presentes">
      <div className="container gifts-inner">
        <div className="gifts-visual reveal">
          <div className="gifts-arch">
            <Image src="/brand/presente-cesta.webp" alt="Cesta de presente Lavena com sabonete líquido, geleia de banho e sabonetes" fill sizes="(max-width: 900px) 90vw, 460px" className="gifts-img" />
          </div>
          <Sprig className="gifts-sprig" />
        </div>
        <div className="gifts-copy reveal">
          <span className="eyebrow">{copy.giftsEyebrow}</span>
          <h2>
            {copy.giftsPre} <span className="title-accent">{copy.giftsAccent}</span>
          </h2>
          <p className="gifts-lead">{copy.giftsLead}</p>
          <ul className="check-list">
            <li>
              <Check size={18} /> Kits prontos ou produtos avulsos
            </li>
            <li>
              <Check size={18} /> Embalagem à sua escolha
            </li>
            <li>
              <Check size={18} /> Cartão com mensagem personalizada
            </li>
          </ul>
          <div className="gifts-cta">
            <Link href="/presente" className="btn btn-primary btn-lg">
              Montar meu presente
            </Link>
            <Link href={hasKits ? "#kits" : "/loja"} className="btn btn-outline btn-lg">
              {hasKits ? "Ver kits prontos" : "Ver produtos"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── História da marca ─── */
export function Story() {
  return (
    <section className="section story" id="historia">
      <div className="container story-inner">
        <div className="story-seal reveal">
          <div className="story-seal-ring">
            <Image src="/brand/selo.webp" alt="Selo Lavena Saboaria Artesanal" width={320} height={320} />
          </div>
        </div>
        <div className="story-copy reveal">
          <span className="eyebrow">Nossa história</span>
          <h2>
            Mais do que um nome, <span className="title-accent">uma essência</span>
          </h2>
          <p>
            Inspirada na origem latina <em>“lavare”</em>, Lavena carrega o significado de <strong>lavar, purificar e renovar</strong>. Nossa saboaria nasce desse propósito: transformar o cuidado diário em um momento de leveza, frescor e bem-estar.
          </p>
          <p>Cada detalhe é pensado para transmitir pureza, carinho e conexão com você — da espuma suave ao perfume delicado que envolve a pele.</p>

          <div className="story-pillars">
            {[
              { icon: Droplets, t: "Lavar", d: "Limpeza que cuida." },
              { icon: Leaf, t: "Purificar", d: "Renova por dentro e por fora." },
              { icon: Sparkles, t: "Renovar", d: "Transforma cada dia em um novo começo." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="pillar">
                <Icon size={24} strokeWidth={1.4} />
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="about-feel reveal">
          <p className="about-feel-title">Lavena é sobre</p>
          <div className="about-feel-grid">
            {[
              { icon: Heart, t: "Sentir", d: "Acolhe, conforta e desperta bons sentimentos." },
              { icon: HandHeart, t: "Cuidar", d: "Do corpo, da mente e dos pequenos momentos." },
              { icon: Flower2, t: "Renovar", d: "De dentro para fora, com leveza, equilíbrio e bem-estar." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t}>
                <span className="feel-icon">
                  <Icon size={22} />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <p className="script about-feel-sign">Sinta a pureza. Viva Lavena.</p>
        </div>
      </div>
    </section>
  );
}

/* ─── Como pedir ─── */
export function Steps({ deliveryInfo }: { deliveryInfo: string | null }) {
  const steps = [
    { icon: ShoppingBag, t: "Escolha com calma", d: "Navegue pela loja, conheça os aromas e coloque na sacola o que combina com você." },
    { icon: Send, t: "Envie pelo WhatsApp", d: "Preencha seus dados e finalize: o resumo do pedido já vai pronto numa mensagem para nós." },
    { icon: PackageCheck, t: "Combine e receba", d: "Combinamos pagamento e entrega diretamente com você, de forma simples e cuidadosa." },
  ];
  return (
    <section className="section section-alt" id="como-pedir">
      <div className="container">
        <div className="section-head is-centered reveal">
          <span className="eyebrow is-centered">Como pedir</span>
          <h2>
            Simples como <span className="title-accent">deve ser</span>
          </h2>
        </div>
        <ol className="steps">
          {steps.map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="step reveal">
              <span className="step-num">{i + 1}</span>
              <span className="step-icon">
                <Icon size={24} strokeWidth={1.4} />
              </span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
        {deliveryInfo && (
          <div className="delivery-note reveal">
            <PackageCheck size={20} />
            <p>{deliveryInfo}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Perguntas frequentes ─── */
const FAQ = [
  {
    q: "Como faço meu pedido?",
    a: "É só adicionar os produtos à sacola, preencher seus dados e finalizar. O resumo do pedido abre no WhatsApp, pronto para enviar. A partir daí combinamos pagamento e entrega com você.",
  },
  {
    q: "Quais são as formas de pagamento e entrega?",
    a: "Pagamento e entrega são combinados pelo WhatsApp, de acordo com a sua região e a sua preferência. O frete é calculado à parte e informado antes da confirmação.",
  },
  {
    q: "O que significa “sob encomenda”?",
    a: "São produtos preparados sob demanda. Você faz a reserva e combinamos com você o prazo de preparo antes de confirmar o pedido.",
  },
  {
    q: "Posso montar um presente personalizado?",
    a: "Pode! Na página Monte um presente você escolhe kits ou produtos avulsos, a embalagem e escreve a mensagem do cartão.",
  },
  {
    q: "Como conservar meu sabonete?",
    a: "Deixe o sabonete secar entre um banho e outro, em uma saboneteira com escoamento e longe do excesso de água. Assim ele rende mais e mantém o perfume por mais tempo.",
  },
];

export function Faq() {
  return (
    <section className="section" id="perguntas">
      <div className="container faq-wrap">
        <div className="section-head reveal">
          <span className="eyebrow">Perguntas frequentes</span>
          <h2>
            Ficou com <span className="title-accent">dúvida?</span>
          </h2>
          <p>Reunimos as respostas mais comuns. Se não encontrar a sua, é só chamar a gente.</p>
        </div>
        <div className="faq-list reveal">
          {FAQ.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Contato ─── */
export function ContactBand({ whatsappNumber, instagramUrl }: { whatsappNumber: string | null; instagramUrl: string | null }) {
  return (
    <section className="container contact-wrap">
      <div className="contact-band reveal">
        <Sprig className="contact-sprig" />
        <div className="contact-copy">
          <h2>Vamos conversar?</h2>
          <p>Tire dúvidas, peça indicações de aromas ou combine uma encomenda especial. Respondemos com todo carinho.</p>
        </div>
        <div className="contact-actions">
          {whatsappNumber && (
            <a className="btn btn-whatsapp btn-lg" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={20} /> Chamar no WhatsApp
            </a>
          )}
          {instagramUrl && (
            <a className="btn btn-lg contact-insta" href={instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon size={20} /> Seguir no Instagram
            </a>
          )}
          {!whatsappNumber && !instagramUrl && <p className="contact-soon">Nossos canais de atendimento estarão disponíveis em breve.</p>}
        </div>
      </div>
    </section>
  );
}
