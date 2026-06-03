import { getProducts, getSettings, getCategories, getActiveKits } from "../actions";
import GiftBuilder from "../components/GiftBuilder";

export const dynamic = "force-dynamic";

export default async function PresentePage() {
  const [products, settings, categories, kits] = await Promise.all([
    getProducts(),
    getSettings(),
    getCategories(),
    getActiveKits(),
  ]);

  return (
    <GiftBuilder
      products={products as any}
      kits={kits as any}
      categories={categories as any}
      whatsappNumber={settings?.whatsappNumber || ""}
    />
  );
}
