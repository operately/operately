import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { BillingDangerBanner, type BillingDangerBannerViewModel } from ".";
import { paymentBanner, limitBanner } from "./mockData";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-06-01T12:00:00Z"));
});

afterEach(() => jest.useRealTimers());

function renderBanner(banner: BillingDangerBannerViewModel) {
  return render(
    <MemoryRouter>
      <BillingDangerBanner banner={banner} formattedTimePreferences={defaultFormattedTimePreferences} />
    </MemoryRouter>,
  );
}

test.each([true, false])("English payment grace preserves date and contact branch: %s", (shouldContactAdmin) => {
  renderBanner({ ...paymentBanner, shouldContactAdmin, cta: shouldContactAdmin ? null : paymentBanner.cta });

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Billing needs attention by June 15th or this company will become read-only.",
  );
  expect(screen.queryByRole("link")).toBe(
    shouldContactAdmin ? null : screen.getByRole("link", { name: "Review billing" }),
  );

  if (shouldContactAdmin) expect(screen.getByRole("alert")).toHaveTextContent("Contact an admin or owner.");
});

test.each([true, false])("complete dated sentences can reorder the date: %s", (shouldContactAdmin) => {
  const key =
    "Billing needs attention by <date/> or this company will become read-only." +
    (shouldContactAdmin ? " Contact an admin or owner." : "");
  i18n.addResource("en", "translation", key, "<date/> — translated deadline <script>literal</script>");

  renderBanner({ ...paymentBanner, shouldContactAdmin });

  expect(screen.getByRole("alert")).toHaveTextContent("June 15th — translated deadline");
  expect(document.querySelector("script")).toBeNull();
});

test.each([true, false])("Portuguese grace and read-only branches: %s", async (shouldContactAdmin) => {
  await i18n.changeLanguage("pt-BR");

  const view = renderBanner({ ...paymentBanner, deadline: null, shouldContactAdmin });

  expect(screen.getByRole("alert")).toHaveTextContent("Regularize o pagamento em breve");

  view.unmount();

  renderBanner({ ...paymentBanner, mode: "read_only", shouldContactAdmin });

  expect(screen.getByRole("alert")).toHaveTextContent("O pagamento não foi regularizado a tempo.");
  expect(screen.getByRole("alert")).toHaveTextContent(
    shouldContactAdmin ? "um administrador ou proprietário atualize o faturamento" : "a regularização do faturamento",
  );
});

test.each([
  [["member_count"], "Adding or restoring people is", "A adição ou restauração de pessoas está suspensa"],
  [["storage_bytes"], "Uploading files is", "O envio de arquivos está suspenso"],
  [
    ["member_count", "storage_bytes"],
    "Adding or restoring people and uploading files are",
    "A adição ou restauração de pessoas e o envio de arquivos estão suspensos",
  ],
])("blocked actions use whole sentences: %s", async (blockedLimitKeys, english, portuguese) => {
  for (const shouldContactAdmin of [false, true]) {
    for (const language of ["en", "pt-BR"]) {
      await i18n.changeLanguage(language);

      const view = renderBanner({ ...limitBanner, blockedLimitKeys: blockedLimitKeys as string[], shouldContactAdmin });
      const ending =
        language === "en"
          ? shouldContactAdmin
            ? "Contact an admin or owner."
            : "Review billing to change the plan or reduce usage."
          : shouldContactAdmin
            ? "Entre em contato com um administrador ou proprietário."
            : "Revise o faturamento para alterar o plano ou reduzir o uso.";

      expect(screen.getByRole("alert")).toHaveTextContent(
        `${language === "en" ? english : portuguese} ${language === "en" ? "paused until this company is back within its plan limits." : "até que esta empresa volte a ficar dentro dos limites do plano."} ${ending}`,
      );

      view.unmount();
    }
  }
});

test("usage values, CTA destinations, and missing-language fallback are preserved", async () => {
  await i18n.changeLanguage("pt-BR");

  const view = renderBanner(limitBanner);

  expect(screen.getByRole("alert")).toHaveTextContent("Membros ativos: 21 / 20");
  expect(screen.getByRole("alert")).toHaveTextContent("Armazenamento usado: 1.1 GB / 1 GB");
  expect(screen.getByRole("link", { name: "Revisar faturamento" })).toHaveAttribute("href", "/billing/plans");

  view.unmount();

  i18n.removeResourceBundle("pt-BR", "translation");

  renderBanner(paymentBanner);

  expect(screen.getByRole("alert")).toHaveTextContent("Payment issue requires attention");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Billing needs attention by June 15th or this company will become read-only.",
  );
});

test.each([true, false])("Portuguese dated grace preserves formatting preferences: %s", async (shouldContactAdmin) => {
  await i18n.changeLanguage("pt-BR");
  renderBanner({ ...paymentBanner, shouldContactAdmin });

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Regularize o pagamento até June 15th para evitar que esta empresa fique em modo somente leitura.",
  );
});
