-- Foto e legenda da seção "Nossa história"
ALTER TABLE "saboaria"."Settings" ADD COLUMN IF NOT EXISTS "storyImageUrl" TEXT;
ALTER TABLE "saboaria"."Settings" ADD COLUMN IF NOT EXISTS "storyCaption" TEXT;
