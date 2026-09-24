import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
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
  options: { lng?: string; portuguese?: Record<string, string> } = {},
) {
  const i18n = createInstance();
  await i18n.init({
    lng: options.lng ?? "en",
    fallbackLng: "en",
    keySeparator: false,
    nsSeparator: false,
    resources: {
      en: { translation: resources },
      ...(options.portuguese ? { "pt-BR": { translation: options.portuguese } } : {}),
    },
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <CompanyMemberOnboardingWizard {...props} {...overrides} />
    </I18nextProvider>,
  );
}

function chooseFile(file: File) {
  fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
}

const catalogEnglish = {
  "What's your role?": "What's your role?",
  "Your role": "Your role",
  Back: "Back",
  Next: "Next",
  "Add your profile picture": "Add your profile picture",
  "Step {{stepNumber}} of {{totalSteps}}": "Step {{stepNumber}} of {{totalSteps}}",
  "Please choose an image file.": "Please choose an image file.",
  Finish: "Finish",
};

const catalogPortuguese = {
  Back: "Voltar",
  Next: "Next",
  "What's your role?": "What's your role?",
  "Your role": "Your role",
  "Add your profile picture": "Add your profile picture",
  "Step {{stepNumber}} of {{totalSteps}}": "Step {{stepNumber}} of {{totalSteps}}",
  "Please choose an image file.": "Please choose an image file.",
  Finish: "Finish",
};

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

it.each([
  ["Add your profile picture", "Upload photo", "Step {{stepNumber}} of {{totalSteps}}", "Finish"],
  [
    "Translated avatar heading",
    "Translated upload",
    "Translated step {{stepNumber}} of {{totalSteps}}",
    "Translated finish",
  ],
])("uses catalog copy for the avatar step: %s", async (title, upload, step, finish) => {
  await renderWizard(
    {
      "Add your profile picture": title,
      "Upload photo": upload,
      "Step {{stepNumber}} of {{totalSteps}}": step,
      Finish: finish,
    },
    { __initialStep: "avatar" },
  );

  expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: upload })).toBeInTheDocument();
  expect(screen.getByText(step.replace("{{stepNumber}}", "2").replace("{{totalSteps}}", "2"))).toBeInTheDocument();
  expect(screen.getByRole("button", { name: finish })).toBeInTheDocument();
});

it.each([
  ["Please choose an image file.", "Please choose an image smaller than 5MB."],
  ["Translated image type error", "Translated image size error"],
])("uses catalog copy for avatar upload errors: %s", async (typeError, sizeError) => {
  await renderWizard(
    {
      "Please choose an image file.": typeError,
      "Please choose an image smaller than 5MB.": sizeError,
    },
    { __initialStep: "avatar" },
  );

  chooseFile(new File(["notes"], "notes.txt", { type: "text/plain" }));
  expect(screen.getByText(typeError)).toBeInTheDocument();

  const oversized = new File(["photo"], "photo.png", { type: "image/png" });
  Object.defineProperty(oversized, "size", { value: 5 * 1024 * 1024 + 1 });
  chooseFile(oversized);
  expect(screen.getByText(sizeError)).toBeInTheDocument();
});

it("uses Portuguese Back with English identity for untranslated role copy", async () => {
  await renderWizard(catalogEnglish, { __initialStep: "role" }, { lng: "pt-BR", portuguese: catalogPortuguese });

  expect(screen.getByRole("heading", { name: "What's your role?" })).toBeInTheDocument();
  expect(screen.getByText("Your role")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
});

it("uses English identity for untranslated avatar copy", async () => {
  await renderWizard(catalogEnglish, { __initialStep: "avatar" }, { lng: "pt-BR", portuguese: catalogPortuguese });

  expect(screen.getByRole("heading", { name: "Add your profile picture" })).toBeInTheDocument();
  expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();

  chooseFile(new File(["notes"], "notes.txt", { type: "text/plain" }));
  expect(screen.getByText("Please choose an image file.")).toBeInTheDocument();
});
