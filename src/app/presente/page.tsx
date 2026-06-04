import { getProducts, getSettings, getCategories, getActiveKits, getActiveBags } from "../actions";
import GiftBuilder from "../components/GiftBuilder";

export const dynamic = "force-dynamic";

export default async function PresentePage() {
  const [products, settings, categories, kits, bags] = await Promise.all([
    getProducts(),
    getSettings(),
    getCategories(),
    getActiveKits(),
    getActiveBags(),
  ]);

  const activeCategories = categories.filter(c => products.some(p => p.categoryId === c.id));

  return (
    <GiftBuilder
      products={products as any}
      kits={kits as any}
      categories={activeCategories as any}
      bags={bags as any}
      whatsappNumber={settings?.whatsappNumber || ""}
    />
  );
}
