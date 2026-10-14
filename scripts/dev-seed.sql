-- DADOS DE EXEMPLO — somente para desenvolvimento local. NÃO rodar em produção.
-- Uso: psql "$DATABASE_URL" -f scripts/dev-seed.sql
BEGIN;
TRUNCATE "saboaria"."Order", "saboaria"."ProductVariant", "saboaria"."Product", "saboaria"."Kit", "saboaria"."Bag", "saboaria"."Category", "saboaria"."Settings" RESTART IDENTITY CASCADE;

INSERT INTO "saboaria"."Settings" ("id","whatsappNumber","instagramUrl","announcement","deliveryInfo","heroImages","heroImageLinks","updatedAt")
VALUES ('default','5511999990000','https://instagram.com/lavena.exemplo',NULL,'Entregamos na região e enviamos para todo o Brasil. O frete é calculado conforme o endereço e combinado pelo WhatsApp.',ARRAY[]::text[],ARRAY[]::text[],now());

INSERT INTO "saboaria"."Category" ("id","name","slug","createdAt","updatedAt") VALUES
 ('cat-glic','Sabonetes Glicerinados','sabonetes-glicerinados', now() - interval '4 day', now()),
 ('cat-liq','Sabonete Líquido','sabonete-liquido', now() - interval '3 day', now()),
 ('cat-gel','Geleia de Banho','geleia-de-banho', now() - interval '2 day', now()),
 ('cat-mou','Mousse de Banho','mousse-de-banho', now() - interval '1 day', now()),
 ('cat-vazia','Sabonete de Colher','sabonete-de-colher', now(), now());

INSERT INTO "saboaria"."Product" ("id","name","slug","description","benefits","ingredients","price","salePrice","size","imageUrl","images","stockStatus","stockQuantity","lowStockAlert","categoryId","isFeatured","isVisible","createdAt","updatedAt") VALUES
 ('p-glic','Sabonete Glicerinado Floral','sabonete-glicerinado-floral','Sabonete glicerinado com pétalas e ervas, de limpeza suave e aroma delicado que transforma o seu dia em um momento especial.',E'- Limpeza suave\n- Hidrata e nutre\n- Aromas delicados\n- Base vegetal','Base de glicerina vegetal, pétalas de flores secas, ervas, essência cosmética.',18.00,NULL,'100g','/brand/glicerinados.webp',ARRAY['/brand/sabonetes-trio.webp'],'IN_STOCK',12,3,'cat-glic',true,true,now() - interval '6 day',now()),
 ('p-mar','Sabonete de Maracujá','sabonete-de-maracuja','Sabonete com sementes de maracujá: refrescância e energia que despertam os sentidos.',E'- Refrescante\n- Esfoliação leve','Base de glicerina vegetal, sementes de maracujá, essência cosmética.',16.00,14.00,'90g','/brand/sabonetes-trio.webp',ARRAY[]::text[],'IN_STOCK',2,3,'cat-glic',false,true,now() - interval '5 day',now()),
 ('p-mel','Sabonete de Mel','sabonete-de-mel','Nutrição e suavidade que abraçam a pele com o doce cuidado da natureza.',NULL,'Base de glicerina vegetal, mel, essência cosmética.',16.00,NULL,'90g','/brand/sabonetes-trio.webp',ARRAY[]::text[],'OUT_OF_STOCK',0,3,'cat-glic',false,true,now() - interval '5 day',now()),
 ('p-liq','Sabonete Líquido Maracujá','sabonete-liquido-maracuja','Limpeza suave que cuida, hidrata e perfuma a sua pele todos os dias. Fórmula suave e equilibrada.',E'- Fórmula suave\n- Hidrata e protege\n- Aromas delicados','Água, base surfactante suave, glicerina, essência cosmética.',29.90,NULL,'250ml','/brand/liquido.webp',ARRAY['/brand/liquidos-trio.webp'],'IN_STOCK',0,3,'cat-liq',true,true,now() - interval '4 day',now()),
 ('p-gel','Geleia de Banho Maracujá','geleia-de-banho-maracuja','Textura única que transforma seu banho em um momento de cuidado e bem-estar. Sensação de spa todos os dias.',E'- Hidrata e nutre\n- Textura gelatinosa\n- Aromas delicados','Água, base gelificante, sementes de maracujá, essência cosmética.',34.90,NULL,'250g','/brand/geleia-maracuja.webp',ARRAY['/brand/geleia-rosa.webp'],'IN_STOCK',8,3,'cat-gel',true,true,now() - interval '3 day',now()),
 ('p-gel2','Geleia de Banho Rosé','geleia-de-banho-rose','Fragrâncias envolventes, sensação de frescor e hidratação para a sua pele.',NULL,'Água, base gelificante, glitter biodegradável, essência cosmética.',34.90,NULL,'250g','/brand/geleia-rosa.webp',ARRAY[]::text[],'IN_PRODUCTION',0,3,'cat-gel',false,true,now() - interval '2 day',now()),
 ('p-mou','Mousse de Banho Melancia','mousse-de-banho-melancia','Uma experiência cremosa e perfumada que transforma seu banho em um momento de puro bem-estar.',E'- Limpa e hidrata\n- Textura cremosa e delicada','Base cremosa, manteiga vegetal, essência cosmética.',39.90,NULL,'250g','/brand/mousse.webp',ARRAY[]::text[],'IN_STOCK',0,3,'cat-mou',false,true,now() - interval '1 day',now()),
 ('p-oculto','Produto Oculto de Teste','produto-oculto-de-teste','Não deve aparecer na loja.',NULL,NULL,10.00,NULL,NULL,NULL,ARRAY[]::text[],'IN_STOCK',0,3,'cat-glic',false,false,now(),now());

INSERT INTO "saboaria"."ProductVariant" ("id","productId","name","price","salePrice","imageUrl","stockStatus","stockQuantity","createdAt","updatedAt") VALUES
 ('v-liq500','p-liq','500ml',49.90,NULL,NULL,'IN_STOCK',0,now(),now()),
 ('v-liq1l','p-liq','1 litro',84.90,79.90,NULL,'OUT_OF_STOCK',0,now() + interval '1 second',now());

INSERT INTO "saboaria"."Kit" ("id","name","slug","description","price","salePrice","imageUrl","images","productIds","isActive","isFeatured","stockQuantity","stockStatus","createdAt","updatedAt") VALUES
 ('k-spa','Spa em Casa','spa-em-casa','Geleia de banho, sabonete líquido e sabonete glicerinado para transformar o banho em um ritual de cuidado.',92.00,84.90,'/brand/presente-cesta.webp',ARRAY[]::text[],ARRAY['p-gel','p-liq','p-glic'],true,true,0,'IN_STOCK',now(),now()),
 ('k-dourado','Presente Dourado','presente-dourado','Sabonete líquido, sabonete floral e muito carinho numa bandeja dourada.',75.00,NULL,'/brand/presente-bandeja.webp',ARRAY[]::text[],ARRAY['p-liq','p-glic'],true,false,0,'IN_STOCK',now(),now());

INSERT INTO "saboaria"."Bag" ("id","name","amountPaid","quantity","margin","isActive","createdAt","updatedAt") VALUES
 ('b-kraft','Sacola Kraft com laço',30,10,100,true,now(),now()),
 ('b-lux','Caixa presente premium',90,10,150,true,now(),now());

INSERT INTO "saboaria"."PricingMaterial" ("id","name","amountPaid","quantity","unit","createdAt","updatedAt") VALUES
 ('m-gli','Glicerina vegetal',50,1,'kg',now(),now()),
 ('m-ess','Essência de maracujá',20,100,'ml',now(),now());
COMMIT;
