-- Versão sazonal do site (auto, padrao, natal, ano-novo, ...)
ALTER TABLE "saboaria"."Settings" ADD COLUMN IF NOT EXISTS "siteTheme" TEXT NOT NULL DEFAULT 'padrao';

-- Índice da chave estrangeira de produto -> categoria
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "saboaria"."Product"("categoryId");
