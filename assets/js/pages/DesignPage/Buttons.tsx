import * as React from "react";

import { Section, SectionTitle } from "./Section";
import { PrimaryButton, GhostButton, SecondaryButton } from "@/components/Buttons";

export function Buttons() {
  return (
    <Section>
      <SectionTitle>Buttons</SectionTitle>

      <div className="max-w-2xl mb-8">
        <p className="mt-2">
          Operately uses rounded primary and secondary buttons. The primary button is used for the main action on a
          page, while the secondary button is used for secondary actions or as a subtle call to action. We write UI copy
          in active voice, not capitalized.
        </p>
      </div>

      <h3 className="font-bold mb-4">Primary buttons</h3>

      <div className="flex items-center space-x-4">
        <PrimaryButton size="xxs">Button text</PrimaryButton>
        <PrimaryButton size="xs">Button text</PrimaryButton>
        <PrimaryButton size="sm">Button text</PrimaryButton>
        <PrimaryButton size="base">Button text</PrimaryButton>
        <PrimaryButton size="lg">Button text</PrimaryButton>
      </div>

      <div className="flex items-center space-x-4 mt-4">
        <PrimaryButton loading={true} size="xxs">
          Button text
        </PrimaryButton>
        <PrimaryButton loading={true} size="xs">
          Button text
        </PrimaryButton>
        <PrimaryButton loading={true} size="sm">
          Button text
        </PrimaryButton>
        <PrimaryButton loading={true} size="base">
          Button text
        </PrimaryButton>
        <PrimaryButton loading={true} size="lg">
          Button text
        </PrimaryButton>
      </div>

      <h3 className="font-bold mt-8 mb-4">Ghost buttons</h3>

      <div className="flex items-center space-x-4 w-auto">
        <GhostButton size="xxs">Button text</GhostButton>
        <GhostButton size="xs">Button text</GhostButton>
        <GhostButton size="sm">Button text</GhostButton>
        <GhostButton size="base">Button text</GhostButton>
        <GhostButton size="lg">Button text</GhostButton>
      </div>

      <div className="flex items-center space-x-4 w-auto mt-4">
        <GhostButton loading={true} size="xxs">
          Button text
        </GhostButton>
        <GhostButton loading={true} size="xs">
          Button text
        </GhostButton>
        <GhostButton loading={true} size="sm">
          Button text
        </GhostButton>
        <GhostButton loading={true} size="base">
          Button text
        </GhostButton>
        <GhostButton loading={true} size="lg">
          Button text
        </GhostButton>
      </div>

      <h3 className="font-bold mt-8 mb-4">Secondary buttons</h3>

      <div className="flex items-center space-x-4 w-auto">
        <SecondaryButton size="xxs">Button text</SecondaryButton>
        <SecondaryButton size="xs">Button text</SecondaryButton>
        <SecondaryButton size="sm">Button text</SecondaryButton>
        <SecondaryButton size="base">Button text</SecondaryButton>
        <SecondaryButton size="lg">Button text</SecondaryButton>
      </div>

      <div className="flex items-center space-x-4 w-auto mt-4">
        <SecondaryButton loading={true} size="xxs">
          Button text
        </SecondaryButton>
        <SecondaryButton loading={true} size="xs">
          Button text
        </SecondaryButton>
        <SecondaryButton loading={true} size="sm">
          Button text
        </SecondaryButton>
        <SecondaryButton loading={true} size="base">
          Button text
        </SecondaryButton>
        <SecondaryButton loading={true} size="lg">
          Button text
        </SecondaryButton>
      </div>
    </Section>
  );
}
