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

function renderPage(
  state: CompanyAdminAddPeoplePage.PageState,
  memberType: CompanyAdminAddPeoplePage.MemberType,
  overrides: Partial<CompanyAdminAddPeoplePage.Props> = {},
) {
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
        {...overrides}
      />
    </MemoryRouter>,
  );
}

it("renders field errors beside preserved values and lets short values reach submission", () => {
  const onSubmit = jest.fn();
  const { container } = renderPage({ state: "form" }, "team_member", {
    formValues: { fullName: "Al", email: "a@", title: "Designer" },
    formErrors: { fullName: "Name error", email: "Email error" },
    onSubmit,
  });

  expect(screen.getByLabelText("Full Name")).toHaveValue("Al");
  expect(screen.getByLabelText("Email")).toHaveValue("a@");
  expect(container.querySelector('[data-test-id="fullname-error"]')).toHaveTextContent("Name error");
  expect(container.querySelector('[data-test-id="email-error"]')).toHaveTextContent("Email error");

  const submit = screen.getByRole("button", { name: "Invite Member" });
  expect(submit.closest("form")).toHaveAttribute("novalidate");
  expect(screen.getByLabelText("Full Name")).toHaveAttribute("minlength", "3");
  expect(screen.getByLabelText("Email")).toHaveAttribute("minlength", "3");
  fireEvent.click(submit);
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

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
