import Link from "next/link";
import Image from "next/image";
import { Mail, MessageCircle } from "lucide-react";
import Wordmark from "./wordmark";
import { Heart, InstagramIcon } from "@/components/ui/ornaments";
import { formatPhone } from "@/lib/format";

export default function Footer({ whatsappNumber, instagramUrl }: { whatsappNumber: string | null; instagramUrl: string | null }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-seal">
              <Image src="/brand/selo.webp" alt="" width={88} height={88} />
            </div>
            <Wordmark light />
            <p className="footer-lead">
              Criamos experiências que <em>cuidam de você</em>. Produtos artesanais, feitos à mão com ingredientes selecionados e muito carinho.
            </p>
          </div>

          <nav className="footer-col" aria-label="Loja">
            <h4>Loja</h4>
            <Link href="/loja">Todos os produtos</Link>
            <Link href="/presente">Monte um presente</Link>
            <Link href="/carrinho">Minha sacola</Link>
          </nav>

          <nav className="footer-col" aria-label="Ajuda">
            <h4>Ajuda</h4>
            <Link href="/#historia">Nossa história</Link>
            <Link href="/#como-pedir">Como pedir</Link>
            <Link href="/#perguntas">Perguntas frequentes</Link>
          </nav>

          <div className="footer-col">
            <h4>Fale com a gente</h4>
            {whatsappNumber ? (
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> {formatPhone(whatsappNumber)}
              </a>
            ) : (
              <span className="footer-muted">
                <Mail size={16} /> Em breve nossos canais de contato
              </span>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={16} /> Instagram
              </a>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Lavena Saboaria Artesanal · Feito com <Heart size={12} /> e muito cuidado
          </p>
          <Link href="/admin" className="footer-admin" rel="nofollow">
            Área da loja
          </Link>
        </div>
      </div>
    </footer>
  );
}
