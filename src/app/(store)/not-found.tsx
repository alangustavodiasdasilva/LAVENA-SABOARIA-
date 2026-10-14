import Link from "next/link";
import { Sprig } from "@/components/ui/ornaments";

export default function NotFound() {
  return (
    <div className="container notfound">
      <Sprig className="notfound-sprig" />
      <p className="script notfound-script">Ops…</p>
      <h1>Página não encontrada</h1>
      <p className="soft">O endereço que você tentou abrir não existe mais ou mudou de lugar.</p>
      <div className="notfound-actions">
        <Link href="/" className="btn btn-primary btn-lg">
          Voltar ao início
        </Link>
        <Link href="/loja" className="btn btn-outline btn-lg">
          Ver a loja
        </Link>
      </div>
    </div>
  );
}
