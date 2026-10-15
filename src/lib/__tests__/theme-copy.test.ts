import { describe, expect, it } from "vitest";
import { THEME_COPY, fillCopy, productsPhrase } from "../theme-copy";

describe("texto adaptado ao catálogo", () => {
  it("monta a frase com as categorias reais", () => {
    expect(productsPhrase(["Sabonetes", "Geleia de Banho", "Mousse"])).toBe("sabonetes, geleia de banho e mousse");
    expect(productsPhrase(["Velas"])).toBe("velas");
    expect(productsPhrase([])).toBe("nossos produtos artesanais");
  });
  it("troca o marcador nos textos de todos os temas", () => {
    for (const copy of Object.values(THEME_COPY)) {
      const out = fillCopy(copy, ["Velas aromáticas", "Difusores"]);
      expect(out.heroLead).not.toContain("{");
      expect(out.giftsLead).not.toContain("{");
    }
    expect(fillCopy(THEME_COPY.padrao, ["Velas", "Difusores"]).heroLead).toContain("Velas e difusores feitos à mão");
  });
});
