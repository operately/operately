import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import React from "react";
import { I18nextProvider } from "react-i18next";

import { CompanyMemberOnboardingWizard } from "./CompanyMemberOnboarding";

const props: CompanyMemberOnboardingWizard.Props = {
  onComplete: jest.fn(),
  onDismiss: jest.fn(),
  markoImageUrl: "https://example.com/marko.jpg",
};

async function renderWizard(
  resources: Record<string, string>,
  overrides: Partial<CompanyMemberOnboardingWizard.Props> = {},
) {
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources: { en: { translation: resources } } });

  return render(
    <I18nextProvider i18n={i18n}>
      <CompanyMemberOnboardingWizard {...props} {...overrides} />
    </I18nextProvider>,
  );
}

it.each([
  ["Thanks for signing up!", "Let's get started"],
  ["Translated thanks", "Translated start"],
])("uses catalog copy for member onboarding welcome: %s", async (heading, start) => {
  await renderWizard({ "Thanks for signing up!": heading, "Let's get started": start });

  expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: start })).toBeInTheDocument();
});

it.each([
  ["What's your role?", "Your role"],
  ["Translated role heading", "Translated role label"],
])("uses catalog copy for the role step: %s", async (title, label) => {
  await renderWizard({ "What's your role?": title, "Your role": label }, { __initialStep: "role" });

  expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  expect(screen.getByText(label)).toBeInTheDocument();
});
