import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { MenuActionItem } from "@/components/Menu";

export function Actions() {
  return (
    <div className="flex justify-end gap-2 items-center border-b border-stroke-base pb-4 mb-8">
      <SecondaryButton linkTo={""} testId="update-progress-button" size="sm">
        <Icons.IconStarFilled size={16} />
      </SecondaryButton>

      <SecondaryButton
        linkTo={""}
        testId="update-progress-button"
        size="sm"
        options={[
          <MenuActionItem onClick={() => {}}>All Updates</MenuActionItem>,
          <MenuActionItem onClick={() => {}}>Check-ins</MenuActionItem>,
        ]}
      >
        <Icons.IconBell size={16} />
        Follow
      </SecondaryButton>

      <PrimaryButton linkTo={""} testId="update-progress-button" size="sm">
        Check In
      </PrimaryButton>
    </div>
  );
}
