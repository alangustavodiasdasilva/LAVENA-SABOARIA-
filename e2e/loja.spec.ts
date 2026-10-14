import { expect, test } from "@playwright/test";

test.describe("loja", () => {
  test("home e catálogo carregam os produtos de exemplo", async ({ page }) => {
    await page.goto("/loja");
    await expect(page.getByText("Sabonete Glicerinado Floral").first()).toBeVisible();
    await expect(page.getByText("Geleia de Banho Maracujá").first()).toBeVisible();
  });

  test("produto esgotado não pode ser comprado", async ({ page }) => {
    await page.goto("/produto/sabonete-de-mel");
    await expect(page.getByRole("button", { name: "Produto esgotado" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Adicionar à sacola" })).toHaveCount(0);
  });

  test("compra completa: sacola, dados do cliente e pedido registrado", async ({ page }) => {
    await page.goto("/produto/sabonete-glicerinado-floral");
    await page.getByRole("button", { name: "Adicionar à sacola" }).click();

    await page.goto("/carrinho");
    await expect(page.getByRole("list", { name: "Itens da sacola" })).toContainText("Sabonete Glicerinado Floral");

    await page.locator("#c-name").fill("Cliente Teste E2E");
    await page.getByText("Retirada", { exact: true }).click();
    await page.locator("#c-notes").fill("pedido gerado pelo teste automático");
    // o primeiro botão de envio (resumo) finaliza o pedido
    await page.getByRole("button", { name: /whatsapp|enviar|finalizar/i }).first().click();

    await expect(page.getByRole("heading", { name: /Pedido recebido|Quase lá/ })).toBeVisible();
    await expect(page.getByText(/LV-\d+/).first()).toBeVisible();
  });

  test("nome é obrigatório para finalizar", async ({ page }) => {
    await page.goto("/produto/sabonete-glicerinado-floral");
    await page.getByRole("button", { name: "Adicionar à sacola" }).click();
    await page.goto("/carrinho");
    await page.getByRole("button", { name: /whatsapp|enviar|finalizar/i }).first().click();
    await expect(page.locator("#c-name")).toHaveAttribute("aria-invalid", "true");
  });
});
