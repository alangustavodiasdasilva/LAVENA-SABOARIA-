import { expect, test } from "@playwright/test";

const PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "212472";

test.describe("painel", () => {
  test("painel exige login", async ({ page }) => {
    await page.goto("/admin/pedidos");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("senha errada é recusada", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator("#admin-password").fill("senha-errada-123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("login e navegação pelas telas principais", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator("#admin-password").fill(PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).not.toHaveURL(/\/admin\/login/);

    for (const path of ["/admin/pedidos", "/admin/produtos", "/admin/estoque", "/admin/configuracoes"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(path));
    }
  });
});
