import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildNotificationText, notifyNewOrder } from "../notify";

const order = {
  code: "LV-12345",
  customerName: "Maria",
  total: 42.5,
  items: [
    { kind: "product" as const, name: "Sabonete de Mel", unitPrice: 20, quantity: 2 },
    { kind: "product" as const, name: "Geleia", unitPrice: 2.5, quantity: 1, reserve: true },
    { kind: "bag" as const, name: "Sacola", unitPrice: 0, quantity: 1 },
  ],
};

describe("aviso de pedido novo", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    delete process.env.NTFY_TOPIC;
    delete process.env.RESEND_API_KEY;
    delete process.env.NOTIFY_EMAIL;
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("monta título e corpo sem a sacola", () => {
    const { title, body } = buildNotificationText(order);
    expect(title).toContain("LV-12345");
    expect(body).toContain("2x Sabonete de Mel");
    expect(body).toContain("1x Geleia (encomenda)");
    expect(body).not.toContain("Sacola");
  });

  it("não faz nada sem canais configurados", async () => {
    await notifyNewOrder(order);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia ao ntfy e ao Resend quando configurados", async () => {
    process.env.NTFY_TOPIC = "lavena-teste";
    process.env.RESEND_API_KEY = "re_test";
    process.env.NOTIFY_EMAIL = "a@x.com, b@x.com";
    await notifyNewOrder(order);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).toContain("https://ntfy.sh/lavena-teste");
    expect(urls).toContain("https://api.resend.com/emails");
    const resend = fetchMock.mock.calls.find((c) => c[0] === "https://api.resend.com/emails")!;
    expect(JSON.parse(resend[1].body).to).toEqual(["a@x.com", "b@x.com"]);
  });

  it("nunca lança erro se o envio falha", async () => {
    process.env.NTFY_TOPIC = "lavena-teste";
    fetchMock.mockRejectedValue(new Error("rede fora"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(notifyNewOrder(order)).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
