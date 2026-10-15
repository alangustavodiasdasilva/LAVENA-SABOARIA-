-- Variações em duas dimensões: essência (nome) e tamanho/peso
ALTER TABLE "saboaria"."Product" ADD COLUMN IF NOT EXISTS "essence" TEXT;
ALTER TABLE "saboaria"."ProductVariant" ADD COLUMN IF NOT EXISTS "size" TEXT;
