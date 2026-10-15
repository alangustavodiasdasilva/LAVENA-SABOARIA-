import type { ThemeId } from "./themes";

/** Textos da página inicial por tema: cada data comemorativa muda as frases, não só as cores. */
export type ThemeCopy = {
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroLead: string;
  heroCta: string;
  heroChips: [string, string, string];
  featuredPre: string;
  featuredAccent: string;
  featuredPost: string;
  kitsPre: string;
  kitsAccent: string;
  giftsEyebrow: string;
  giftsPre: string;
  giftsAccent: string;
  giftsLead: string;
};

const DEFAULT_COPY: ThemeCopy = {
  heroEyebrow: "Saboaria artesanal",
  heroTitle: "Sinta a pureza.",
  heroAccent: "Viva Lavena.",
  heroLead:
    "Sabonetes, sabonetes líquidos, geleias e mousses de banho feitos à mão, com ingredientes selecionados e aromas delicados que transformam o seu banho em um momento de bem-estar.",
  heroCta: "Conhecer os produtos",
  heroChips: ["Feito à mão", "Natural", "Delicado"],
  featuredPre: "Para o seu",
  featuredAccent: "momento",
  featuredPost: "de cuidado",
  kitsPre: "Prontos para",
  kitsAccent: "presentear",
  giftsEyebrow: "Presentes",
  giftsPre: "Presenteie com",
  giftsAccent: "carinho",
  giftsLead:
    "Monte uma sacola presente com os produtos que mais combinam com quem você ama. Escolha a embalagem, escreva um cartão e deixe o resto com a gente.",
};

export const THEME_COPY: Record<ThemeId, ThemeCopy> = {
  padrao: DEFAULT_COPY,
  natal: {
    ...DEFAULT_COPY,
    heroEyebrow: "Natal Lavena",
    heroTitle: "Um Natal cheio de",
    heroAccent: "aroma e afeto.",
    heroLead:
      "Presentes artesanais feitos à mão para espalhar carinho nesta ceia: sabonetes, geleias e mousses de banho que viram lembrança de Natal.",
    heroCta: "Ver presentes de Natal",
    heroChips: ["Feito à mão", "Edição de Natal", "Com muito carinho"],
    featuredPre: "Aromas para o seu",
    featuredAccent: "Natal",
    featuredPost: "mais acolhedor",
    kitsPre: "Kits para",
    kitsAccent: "presentear no Natal",
    giftsEyebrow: "Presente de Natal",
    giftsPre: "Embrulhe o Natal com",
    giftsAccent: "carinho",
    giftsLead: "Monte a sacola de Natal de quem você ama: escolha os produtos, a embalagem e escreva um cartão de fim de ano.",
  },
  "ano-novo": {
    ...DEFAULT_COPY,
    heroEyebrow: "Ano Novo",
    heroTitle: "Comece o ano",
    heroAccent: "cuidando de você.",
    heroLead: "Um novo ciclo pede renovação: banho perfumado, pele macia e um agrado artesanal para brindar a virada.",
    heroCta: "Renovar o banho",
    heroChips: ["Feito à mão", "Renovação", "Bem-estar"],
    featuredPre: "Para um ano",
    featuredAccent: "novo",
    featuredPost: "e leve",
    kitsPre: "Kits para",
    kitsAccent: "brindar a virada",
    giftsEyebrow: "Presente de Ano Novo",
    giftsPre: "Presenteie um recomeço com",
    giftsAccent: "carinho",
    giftsLead: "Monte uma sacola para desejar um ano melhor: produtos escolhidos por você, embalagem e um cartão com seus votos.",
  },
  pascoa: {
    ...DEFAULT_COPY,
    heroEyebrow: "Páscoa Lavena",
    heroTitle: "Uma Páscoa doce,",
    heroAccent: "do jeito Lavena.",
    heroLead: "Lembrancinhas artesanais para adoçar a Páscoa de quem você gosta: perfumadas, delicadas e feitas à mão.",
    heroCta: "Ver lembrancinhas",
    heroChips: ["Feito à mão", "Edição de Páscoa", "Delicado"],
    featuredPre: "Para uma Páscoa",
    featuredAccent: "perfumada",
    featuredPost: "",
    kitsPre: "Kits de Páscoa para",
    kitsAccent: "presentear",
    giftsEyebrow: "Presente de Páscoa",
    giftsPre: "Surpreenda na Páscoa com",
    giftsAccent: "carinho",
    giftsLead: "Monte uma cesta de Páscoa diferente: sabonetes e cuidados artesanais, embalagem à escolha e um cartão especial.",
  },
  "dia-das-maes": {
    ...DEFAULT_COPY,
    heroEyebrow: "Dia das Mães",
    heroTitle: "Para quem cuida de todos,",
    heroAccent: "um cuidado só dela.",
    heroLead: "Mãe merece pausa, perfume e pele macia. Escolha um presente artesanal feito à mão para mostrar o quanto ela é especial.",
    heroCta: "Presentes para a mamãe",
    heroChips: ["Feito à mão", "Com amor de mãe", "Delicado"],
    featuredPre: "Para a",
    featuredAccent: "mãe",
    featuredPost: "que você ama",
    kitsPre: "Kits para",
    kitsAccent: "emocionar a mamãe",
    giftsEyebrow: "Dia das Mães",
    giftsPre: "Presenteie a mamãe com",
    giftsAccent: "carinho",
    giftsLead: "Monte a sacola perfeita para ela: os aromas que ela mais gosta, uma embalagem linda e um cartão escrito por você.",
  },
  namorados: {
    ...DEFAULT_COPY,
    heroEyebrow: "Dia dos Namorados",
    heroTitle: "Amor também se",
    heroAccent: "sente no cuidado.",
    heroLead: "Surpreenda quem você ama com um presente artesanal: aromas envolventes, toque delicado e um cartão cheio de carinho.",
    heroCta: "Ver presentes a dois",
    heroChips: ["Feito à mão", "Romântico", "Cheio de carinho"],
    featuredPre: "Aromas para",
    featuredAccent: "apaixonar",
    featuredPost: "",
    kitsPre: "Kits para",
    kitsAccent: "declarar amor",
    giftsEyebrow: "Dia dos Namorados",
    giftsPre: "Declare seu amor com",
    giftsAccent: "um presente",
    giftsLead: "Monte uma sacola para o seu amor: escolha os produtos, a embalagem e escreva a mensagem do cartão com o coração.",
  },
  "dia-dos-pais": {
    ...DEFAULT_COPY,
    heroEyebrow: "Dia dos Pais",
    heroTitle: "Cuidado e bem-estar",
    heroAccent: "para o seu herói.",
    heroLead: "Um presente artesanal para ele relaxar: banho revigorante, aromas marcantes e feito à mão com capricho.",
    heroCta: "Presentes para o papai",
    heroChips: ["Feito à mão", "Aromas marcantes", "Bem-estar"],
    featuredPre: "Para o",
    featuredAccent: "pai",
    featuredPost: "que merece um mimo",
    kitsPre: "Kits para",
    kitsAccent: "presentear o papai",
    giftsEyebrow: "Dia dos Pais",
    giftsPre: "Presenteie o papai com",
    giftsAccent: "carinho",
    giftsLead: "Monte uma sacola com o que ele mais vai gostar, escolha a embalagem e escreva um cartão para agradecer.",
  },
  "black-friday": {
    ...DEFAULT_COPY,
    heroEyebrow: "Black Friday Lavena",
    heroTitle: "Ofertas feitas à mão,",
    heroAccent: "só por poucos dias.",
    heroLead: "Aproveite condições especiais nos nossos sabonetes, geleias e mousses de banho. Estoque limitado, feito com carinho.",
    heroCta: "Aproveitar ofertas",
    heroChips: ["Tempo limitado", "Feito à mão", "Estoque limitado"],
    featuredPre: "Ofertas para o seu",
    featuredAccent: "banho",
    featuredPost: "",
    kitsPre: "Kits em",
    kitsAccent: "oferta",
    giftsEyebrow: "Presentes",
    giftsPre: "Adiante os presentes com",
    giftsAccent: "economia",
    giftsLead: "Aproveite a Black Friday para montar as sacolas de presente de fim de ano: produtos, embalagem e cartão personalizado.",
  },
};
