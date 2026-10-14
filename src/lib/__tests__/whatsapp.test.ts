import { describe, expect, it } from "vitest";
import { buildOrderMessage, whatsappLink } from "../whatsapp";

const items = [
  { kind: "product" as const, name: "Sabonete de *Mel*", unitPrice: 20, quantity: 2 },
  { kind: "product" as const, name: "Geleia Maracujá", unitPrice: 45, quantity: 1, reserve: true },
  { kind: "bag" as const, name: "Embalagem: Kraft", unitPrice: 6, quantity: 1 },
];

describe("buildOrderMessage", () => {
  it("monta pedido normal com código, reservas e total", () => {
    const msg = buildOrderMessage({
      code: "LV-ABCDE",
      type: "CART",
      customerName: "Ana",
      customerPhone: "11999998888",
      deliveryMethod: "PICKUP",
      notes: "Retiro sábado",
      items,
      total: 91,
    });
    expect(msg).toContain("Sou *Ana*");
    expect(msg).toContain("LV-ABCDE");
    expect(msg).toContain("MEU PEDIDO (Pronta Entrega)");
    expect(msg).toContain("MINHA RESERVA");
    expect(msg).toContain("EMBALAGEM");
    expect(msg).toContain("Retirada");
    expect(msg).toContain("Retiro sábado");
    expect(msg).toMatch(/Total: R\$\s91,00/);
  });

  it("remove asteriscos digitados pelo cliente", () => {
    const msg = buildOrderMessage({ type: "CART", customerName: "*Hack*", items, total: 1 });
    expect(msg).not.toContain("**");
    expect(msg).toContain("Sabonete de Mel");
  });

  it("presente inclui destinatário e cartão", () => {
    const msg = buildOrderMessage({
      type: "GIFT",
      customerName: "Carla",
      recipientName: "Maria",
      cardMessage: "Feliz aniversário ♡",
      items,
      total: 91,
    });
    expect(msg).toContain("sacola presente");
    expect(msg).toContain("*Maria*");
    expect(msg).toContain("Mensagem do cartão");
    expect(msg).toContain("Feliz aniversário");
  });

  it("gera link do wa.me codificado", () => {
    const url = whatsappLink("5511999998888", "Olá & tudo bem?");
    expect(url).toBe("https://wa.me/5511999998888?text=Ol%C3%A1%20%26%20tudo%20bem%3F");
  });
});
