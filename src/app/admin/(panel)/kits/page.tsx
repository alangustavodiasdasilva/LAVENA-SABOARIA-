import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Pencil, Plus } from "lucide-react";
import { EmptyBlock, PageHeader, StockBadge } from "@/components/admin/ui";
import SmartImage from "@/components/ui/smart-image";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminKits } from "@/lib/admin-data";
import { formatBRL } from "@/lib/format";
import { effectivePrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kits" };

export default async function KitsPage() {
  await requirePageAdmin();
  const kits = await getAdminKits();
  return (
    <>
      <PageHeader
        title="Kits"
        subtitle="Combinações de produtos com preço especial."
        actions={
          <Link href="/admin/kits/novo" className="btn btn-primary">
            <Plus size={17} /> Novo kit
          </Link>
        }
      />
      {kits.length === 0 ? (
        <EmptyBlock
          icon={<Gift size={26} />}
          title="Nenhum kit ainda"
          action={
            <Link href="/admin/kits/novo" className="btn btn-primary">
              Criar o primeiro kit
            </Link>
          }
        >
          Monte kits para presente reunindo vários produtos por um preço especial.
        </EmptyBlock>
      ) : (
        <ul className="product-rows">
          {kits.map((k) => (
            <li key={k.id} className={`prow card ${k.isActive ? "" : "is-hidden"}`}>
              <Link href={`/admin/kits/${k.id}`} className="prow-main">
                <span className="prow-img">
                  <SmartImage src={k.imageUrl || k.images[0]} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
                </span>
                <span className="prow-info">
                  <strong>{k.name}</strong>
                  <small>
                    {k.productIds.length} {k.productIds.length === 1 ? "produto" : "produtos"}
                  </small>
                  <span className="prow-meta">
                    <b>{formatBRL(effectivePrice(k))}</b>
                    <StockBadge status={k.stockStatus} />
                    {!k.isActive && <span className="badge badge-dark">Oculto</span>}
                  </span>
                </span>
              </Link>
              <div className="prow-actions">
                <Link href={`/admin/kits/${k.id}`} className="btn btn-outline btn-sm">
                  <Pencil size={14} /> Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
