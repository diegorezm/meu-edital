import { expect, test } from "@playwright/test";

test("criar conta, montar concurso, estudar e ver a semana", async ({ page }) => {
  const email = `e2e${Date.now()}${Math.floor(Math.random() * 1e6)}@exemplo.com`;

  // Criar conta (sem e-mail configurado, entra direto).
  await page.goto("/?conta=criar");
  await page.getByLabel("Como quer ser chamado?").fill("Ana");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-forte-123");
  // Turnstile com a chave de teste aprova sozinho; espera o token chegar.
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", { timeout: 20_000 });
  // Aceite dos termos: o input é oculto (sr-only), então marca pelo teclado.
  await page.getByRole("checkbox").press("Space");
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "Criar conta" }).click();

  // Primeiro concurso.
  await page.getByRole("link", { name: "Começar" }).click();
  await page.getByRole("button", { name: "INSS" }).click();
  await page.getByRole("button", { name: "Seguir" }).click();
  await page.getByRole("button", { name: "10 h" }).click();
  await page.getByRole("button", { name: "Seguir" }).click();
  await page.getByRole("button", { name: "Montar jornada" }).click();

  // A jornada sai gerada pelos pesos: parte para o primeiro bloco.
  await expect(page.getByText(/Bloco 1 de \d+/)).toBeVisible();
  await page.getByRole("button", { name: "Partir" }).click();

  // Registra a sessão sem cronômetro.
  await page.getByRole("button", { name: "Registrar" }).first().click();
  await page.getByLabel("Minutos").fill("45");
  await page.getByLabel("Questões").fill("10");
  await page.getByLabel("Acertos").fill("8");
  await page.getByRole("dialog").or(page.locator("form")).getByRole("button", { name: "Registrar" }).last().click();

  // Comemoração com o XP ganho: 45 + 8 × 2.
  await expect(page.getByText("+61 XP")).toBeVisible();
  await page.getByRole("button", { name: "Seguir a jornada" }).click();
  await expect(page.getByText(/Bloco 2 de \d+/)).toBeVisible();

  // A semana mostra a sessão.
  await page.goto("/semana");
  await expect(page.getByText("45 min").first()).toBeVisible();
});
