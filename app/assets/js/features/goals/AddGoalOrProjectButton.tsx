import React from "react";

import * as Icons from "@tabler/icons-react";

import { PrimaryButton } from "@/components/Buttons";
import { MenuLinkItem } from "@/components/Menu";

export function AddGoalOrProjectButton({ newGoalPath, newProjectPath }) {
  const options = [
    <MenuLinkItem to={newGoalPath} testId="add-goal" icon={Icons.IconTarget}>
      Add Goal
    </MenuLinkItem>,
    <MenuLinkItem to={newProjectPath} testId="add-project" icon={Icons.IconHexagons}>
      Add Project
    </MenuLinkItem>,
  ];

  return (
    <PrimaryButton size="sm" optionsAlign="end" options={options} testId="add-options">
      Add
    </PrimaryButton>
  );
}
