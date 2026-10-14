-- Novos campos de configuração da loja
ALTER TABLE "saboaria"."Settings" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "saboaria"."Settings" ADD COLUMN IF NOT EXISTS "announcement" TEXT;
ALTER TABLE "saboaria"."Settings" ADD COLUMN IF NOT EXISTS "deliveryInfo" TEXT;
ALTER TABLE "saboaria"."Settings" ADD COLUMN IF NOT EXISTS "sessionsValidFrom" TIMESTAMP(3);

-- Índice para buscar variações de um produto
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "saboaria"."ProductVariant"("productId");

-- Pedidos
CREATE TABLE IF NOT EXISTS "saboaria"."Order" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CART',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'TO_ARRANGE',
    "address" TEXT,
    "notes" TEXT,
    "recipientName" TEXT,
    "cardMessage" TEXT,
    "itemsJson" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "adminNotes" TEXT,
    "stockDeducted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_code_key" ON "saboaria"."Order"("code");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "saboaria"."Order"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "saboaria"."Order"("createdAt");

-- O app acessa o banco com a role postgres (ignora RLS). Ligar RLS bloqueia
-- qualquer acesso direto pela API pública do Supabase (chave anon).
ALTER TABLE "saboaria"."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saboaria"."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saboaria"."ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saboaria"."Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saboaria"."Kit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saboaria"."PricingMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saboaria"."PricingRecipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saboaria"."Bag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saboaria"."Order" ENABLE ROW LEVEL SECURITY;
