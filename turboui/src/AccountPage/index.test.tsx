import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";

import { AccountPage } from "./index";

const props: AccountPage.Props = {
  person: { id: "1", fullName: "Ada Lovelace", email: "ada@example.com" },
  profilePath: "/profile",
  settingsPath: "/settings",
  securityPath: "/security",
  homePath: "/home",
  onLogOut: jest.fn(),
};

it.each([
  ["My Account", "Profile", "Sign Out"],
  ["Minha conta", "Perfil", "Sair"],
])("uses catalog copy for account chrome: %s", async (title, profile, signOut) => {
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    resources: { en: { translation: { "My Account": title, Profile: profile, "Sign Out": signOut } } },
  });

  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <AccountPage {...props} />
      </MemoryRouter>
    </I18nextProvider>,
  );

  expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  expect(document.querySelector('[data-test-id="profile-link"]')).toHaveTextContent(profile);
  expect(document.querySelector('[data-test-id="log-out-button"]')).toHaveTextContent(signOut);
});
