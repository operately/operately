import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { BillingPickCompanyPage } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

const props: BillingPickCompanyPage.Props = {
  companies: [],
  plan: null,
  billingPeriod: null,
  billingPath: (id) => `/${id}/billing`,
};

test.each(["en", "pt-BR", "missing"])("headings, counts, and literal company links: %s", async (language) => {
  if (language === "missing") i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage(language === "missing" ? "pt-BR" : language);
  const portuguese = language === "pt-BR";

  render(
    <MemoryRouter>
      <BillingPickCompanyPage
        {...props}
        companies={[0, 1, 2].map((count) => ({
          id: String(count),
          name: `Literal <company> & ${count}`,
          memberCount: count,
        }))}
      />
    </MemoryRouter>,
  );

  expect(screen.getByText(portuguese ? "Selecione uma empresa" : "Select a company")).toBeInTheDocument();
  for (const count of [0, 1, 2]) {
    const countLabel = portuguese
      ? count === 1
        ? "1 membro"
        : `${count} membros`
      : count === 1
        ? "1 member"
        : `${count} members`;
    expect(screen.getByRole("link", { name: `Literal <company> & ${count} ${countLabel}` })).toHaveAttribute(
      "href",
      `/${count}/billing`,
    );
  }
  expect(document.querySelector("company")).toBeNull();
});

test.each([
  ["monthly", "mensal"],
  ["yearly", "anual"],
])("translates selected plan interval: %s", async (billingPeriod, translated) => {
  await i18n.changeLanguage("pt-BR");

  render(
    <MemoryRouter>
      <BillingPickCompanyPage {...props} plan="team" billingPeriod={billingPeriod} />
    </MemoryRouter>,
  );

  expect(screen.getByText(/Plano selecionado:/)).toHaveTextContent(`Plano selecionado: Team (${translated})`);
  expect(
    screen.getByText("Você ainda não tem acesso para gerenciar o faturamento de nenhuma empresa."),
  ).toBeInTheDocument();
});

test("complete plan sentences can reorder literal values", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Selected plan: <plan>{{plan}}</plan> <interval>({{interval}})</interval>":
        "<interval>{{interval}}</interval>: <plan>{{plan}}</plan> selected",
      "Selected plan: <plan>{{plan}}</plan>": "<plan>{{plan}}</plan> selected",
      "Select Company": "Translated title",
    },
    true,
    true,
  );

  const view = render(
    <MemoryRouter>
      <BillingPickCompanyPage {...props} plan="<b>plan</b>" billingPeriod="<custom>" />
    </MemoryRouter>,
  );

  expect(screen.getByText(/selected/)).toHaveTextContent("<custom>: <b>plan</b> selected");
  expect(document.title).toContain("Translated title");
  expect(document.querySelector("b, custom")).toBeNull();

  view.rerender(
    <MemoryRouter>
      <BillingPickCompanyPage {...props} plan="team" />
    </MemoryRouter>,
  );
  expect(screen.getByText(/selected/)).toHaveTextContent("Team selected");
});
