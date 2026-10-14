import Link from "next/link";

export default function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`wordmark ${light ? "is-light" : ""}`} aria-label="Lavena Saboaria Artesanal — página inicial">
      <span className="wordmark-script">Lavena</span>
      <span className="wordmark-sub">Saboaria artesanal</span>
    </Link>
  );
}
