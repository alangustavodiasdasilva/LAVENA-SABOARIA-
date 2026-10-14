import Link from "next/link";
import "@/styles/store.css";
import Wordmark from "@/components/store/wordmark";

export default function RootNotFound() {
  return (
    <div className="container notfound">
      <Wordmark />
      <p className="script notfound-script">Ops…</p>
      <h1>Página não encontrada</h1>
      <p className="soft">O endereço que você tentou abrir não existe mais ou mudou de lugar.</p>
      <div className="notfound-actions">
        <Link href="/" className="btn btn-primary btn-lg">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
