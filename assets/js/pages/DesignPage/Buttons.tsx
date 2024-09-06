import * as React from "react";

import { Section, SectionTitle } from "./Section";
import { FilledButton, GhostButton } from "@/components/Buttons";

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
        <FilledButton size="xxs">Button text</FilledButton>
        <FilledButton size="xs">Button text</FilledButton>
        <FilledButton size="sm">Button text</FilledButton>
        <FilledButton size="base">Button text</FilledButton>
        <FilledButton size="lg">Button text</FilledButton>
      </div>

      <h3 className="font-bold mt-8 mb-4">Ghost buttons - primary</h3>

      <div className="flex items-center space-x-4 w-auto">
        <GhostButton type="primary" size="xxs">
          Button text
        </GhostButton>
        <GhostButton type="primary" size="xs">
          Button text
        </GhostButton>
        <GhostButton type="primary" size="sm">
          Button text
        </GhostButton>
        <GhostButton type="primary" size="base">
          Button text
        </GhostButton>
        <GhostButton type="primary" size="lg">
          Button text
        </GhostButton>
      </div>

      <h3 className="font-bold mt-8 mb-4">Ghost buttons - secondary</h3>

      <div className="flex items-center space-x-4 w-auto">
        <GhostButton type="secondary" size="xxs">
          Button text
        </GhostButton>
        <GhostButton type="secondary" size="xs">
          Button text
        </GhostButton>
        <GhostButton type="secondary" size="sm">
          Button text
        </GhostButton>
        <GhostButton type="secondary" size="base">
          Button text
        </GhostButton>
        <GhostButton type="secondary" size="lg">
          Button text
        </GhostButton>
      </div>
    </Section>
  );
}
