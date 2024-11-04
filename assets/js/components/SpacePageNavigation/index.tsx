import React from "react";

import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Spaces from "@/models/spaces";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

export function SpacePageNavigation({ space }: { space: Spaces.Space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(space.id!)}>
        {React.createElement(Icons[space.icon!], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

export function SpacePageSettings({ space }: { space: Spaces.Space }) {
  assertPresent(space.permissions, "permissions must be loaded");
  if (!space.permissions.canEdit) return null;

  return (
    <div className="flex absolute right-5 top-4">
      <PageOptions.Root noBorder testId="space-settings">
        <PageOptions.Link
          icon={Icons.IconEdit}
          title="Edit name and purpose"
          to={Paths.spaceEditPath(space.id!)}
          testId="edit-name-and-purpose"
        />
        <PageOptions.Link
          icon={Icons.IconPaint}
          title="Change Appearance"
          to={Paths.spaceAppearancePath(space.id!)}
          testId="change-appearance"
        />
      </PageOptions.Root>
    </div>
  );
}
