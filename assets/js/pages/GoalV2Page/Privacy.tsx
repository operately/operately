import React from "react";

import { PrivacyIndicator, PermissionOptions } from "@/features/Permissions";
import { useLoadedData } from "./loader";
import { capitalize } from "@/utils/strings";
import { assertPresent } from "@/utils/assertions";
import { Title } from "./components";

export function Privacy() {
  const { goal } = useLoadedData();

  assertPresent(goal.privacy, "privacy must be present in goal");
  const privacy = capitalize(goal.privacy);

  if (goal.privacy === PermissionOptions.INTERNAL) return null;

  return (
    <div className="flex items-center gap-1">
      <Title title={privacy} />
      <div className="mt-1">
        <PrivacyIndicator goal={goal} size={18} />
      </div>
    </div>
  );
}
