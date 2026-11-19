import React from "react";
import { useTranslation } from "react-i18next";

import { PrimaryButton } from "../Button";
import { IconInfoCircle } from "../icons";
import { Tooltip } from "../Tooltip";

export namespace JoinSpacePrompt {
  export interface Props {
    joining: boolean;
    onJoin: () => void | Promise<void>;
  }
}

export function JoinSpacePrompt({ joining, onJoin }: JoinSpacePrompt.Props) {
  const { t } = useTranslation();
  const explanation = t(
    "Joining adds you to the member list. You’ll get the access and notifications set for space members.",
  );

  return (
    <div className="mb-8 mt-6 flex items-center justify-center gap-2" data-test-id="join-space-prompt">
      <PrimaryButton size="sm" onClick={onJoin} loading={joining} testId="join-space-button">
        {t("Join this Space")}
      </PrimaryButton>
      <Tooltip content={<div className="max-w-xs">{explanation}</div>} size="sm">
        <span className="inline-flex cursor-help text-content-dimmed" aria-label={explanation} role="img" tabIndex={0}>
          <IconInfoCircle size={18} aria-hidden="true" />
        </span>
      </Tooltip>
    </div>
  );
}
