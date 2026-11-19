import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { CompanyAdminAddPeoplePage } from ".";
import i18n from "../i18n";
import ptBR from "../../../app/assets/js/generated/locales/pt-BR.json";

const fullName = "Alex <Morgan>";
const companyName = "Acme & Co";
const inviteLink = "https://app.operately.com/join?token=personal-invitation";
const writeText = jest.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});

function renderPage(state: CompanyAdminAddPeoplePage.PageState, memberType: CompanyAdminAddPeoplePage.MemberType) {
  return render(
    <MemoryRouter>
      <CompanyAdminAddPeoplePage
        companyName={companyName}
        navigationItems={[]}
        state={state}
        memberType={memberType}
        formValues={{ fullName, email: "alex@example.com", title: "Designer" }}
        onFormChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    </MemoryRouter>,
  );
}

describe.each<CompanyAdminAddPeoplePage.MemberType>(["team_member", "outside_collaborator"])("%s", (memberType) => {
  it("explains why an existing user was added without an invitation link", () => {
    renderPage({ state: "added", fullName, personId: "person-1" }, memberType);

    expect(
      screen.getByText(
        `${fullName} already uses Operately. We've added them to ${companyName} and notified them by email.`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy message" })).not.toBeInTheDocument();
    expect(screen.queryByText(inviteLink)).not.toBeInTheDocument();
  });

  it("shows a ready-to-send message with an alternative to copy only the link", async () => {
    renderPage({ state: "invited", fullName, inviteLink, personId: "person-1" }, memberType);

    expect(
      screen.getByText(
        `We've emailed ${fullName} a link to finish setting up their account. You can also share it below.`,
      ),
    ).toBeInTheDocument();

    const message = `Hi ${fullName}, I've invited you to join ${companyName} on Operately. Use this link to finish setting up your account: ${inviteLink}`;
    expect(screen.getByText(inviteLink).parentElement).toHaveTextContent(message);

    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(message));

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(inviteLink));
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});

it("copies the translated invitation with literal names and the original link", async () => {
  i18n.addResourceBundle("pt-BR", "translation", ptBR, true, true);
  await i18n.changeLanguage("pt-BR");

  try {
    renderPage({ state: "invited", fullName, inviteLink, personId: "person-1" }, "team_member");
    fireEvent.click(screen.getByRole("button", { name: "Copiar mensagem" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `Olá, ${fullName}! Convidei você para participar da empresa ${companyName} no Operately. Use este link para concluir a configuração da sua conta: ${inviteLink}`,
      ),
    );
  } finally {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    i18n.removeResourceBundle("pt-BR", "translation");
  }
});
