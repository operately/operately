import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Section, SectionTitle } from "./Section";
import { Tooltip } from "@/components/Tooltip";

export function Tooltips() {
  return (
    <Section>
      <SectionTitle>Tooltips</SectionTitle>

      <div className="max-w-2xl mt-2 mb-10">
        Operately uses tooltips to provide additional information about an element when the user hovers over it.
        Tooltips should be used sparingly and only when the information is not immediately clear from the element
        itself.
      </div>

      <div className="flex items-center gap-4">
        <AnyoneOnTheInternetTooltip />
        <PrivateIndicatorTooltip />
        <SecretIndicatorTooltip />
      </div>
    </Section>
  );
}

function AnyoneOnTheInternetTooltip() {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Anyone on the internet</div>
      <div className="text-content-dimmed mt-1 w-64">This project is visible to anyone on the internet.</div>
    </div>
  );

  return (
    <Tooltip content={content} delayDuration={100}>
      <Icons.IconWorld size={24} />
    </Tooltip>
  );
}

function PrivateIndicatorTooltip() {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Confidential</div>
      <div className="text-content-dimmed mt-1 w-64">
        Only poeple who are part of the HR team can view this project.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} delayDuration={100}>
      <Icons.IconLockFilled size={24} />
    </Tooltip>
  );
}

function SecretIndicatorTooltip() {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Invite-only</div>
      <div className="text-content-dimmed mt-1 w-64">Only people who are added to this project can view it.</div>
    </div>
  );

  return (
    <Tooltip content={content} delayDuration={100}>
      <Icons.IconLockFilled size={24} className="text-red-600" />
    </Tooltip>
  );
}
