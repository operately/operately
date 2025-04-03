import React, { useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  DangerButton,
  DangerGhostButton,
  TextButton,
} from "./index";
import { IconPlus, IconEdit } from "./icons"; // This will import from the TypeScript file now
import { Menu } from "../Menu";

/**
 * Example showcasing all button variants
 */
export function ButtonExampleVariants(): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-4">
      <PrimaryButton>
        <span>Primary Button</span>
      </PrimaryButton>
      <SecondaryButton>
        <span>Secondary Button</span>
      </SecondaryButton>
      <GhostButton>
        <span>Ghost Button</span>
      </GhostButton>
      <DangerButton>
        <span>Danger Button</span>
      </DangerButton>
      <TextButton>
        <span>Text Button</span>
      </TextButton>
    </div>
  );
}

/**
 * Example showcasing different button sizes
 */
export function ButtonExampleSizes(): React.ReactElement {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <PrimaryButton size="xxs">
          <span>XXS Size</span>
        </PrimaryButton>
        <PrimaryButton size="xs">
          <span>XS Size</span>
        </PrimaryButton>
        <PrimaryButton size="sm">
          <span>SM Size</span>
        </PrimaryButton>
        <PrimaryButton size="base">
          <span>Base Size</span>
        </PrimaryButton>
        <PrimaryButton size="lg">
          <span>LG Size</span>
        </PrimaryButton>
      </div>

      <div className="flex items-center gap-4">
        <SecondaryButton size="xxs">
          <span>XXS Size</span>
        </SecondaryButton>
        <SecondaryButton size="xs">
          <span>XS Size</span>
        </SecondaryButton>
        <SecondaryButton size="sm">
          <span>SM Size</span>
        </SecondaryButton>
        <SecondaryButton size="base">
          <span>Base Size</span>
        </SecondaryButton>
        <SecondaryButton size="lg">
          <span>LG Size</span>
        </SecondaryButton>
      </div>
    </div>
  );
}

/**
 * Example showcasing loading state buttons
 */
export function ButtonExampleLoading(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (): void => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <PrimaryButton loading={true}>
          <span>Loading</span>
        </PrimaryButton>
        <SecondaryButton loading={true}>
          <span>Loading</span>
        </SecondaryButton>
        <GhostButton loading={true}>
          <span>Loading</span>
        </GhostButton>
        <DangerButton loading={true}>
          <span>Loading</span>
        </DangerButton>
        <DangerGhostButton loading={true}>
          <span>Loading</span>
        </DangerGhostButton>
      </div>

      <div>
        <PrimaryButton onClick={handleClick} loading={isLoading}>
          <span>{isLoading ? "Loading..." : "Click to Load"}</span>
        </PrimaryButton>
      </div>
    </div>
  );
}

/**
 * Example showcasing buttons with icons
 */
export function ButtonExampleWithIcons(): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-4">
      <PrimaryButton>
        <div className="flex items-center gap-2">
          <IconPlus size={16} />
          <span>Add Item</span>
        </div>
      </PrimaryButton>

      <SecondaryButton>
        <div className="flex items-center gap-2">
          <IconEdit size={16} />
          <span>Edit Item</span>
        </div>
      </SecondaryButton>

      <GhostButton>
        <div className="flex items-center gap-2">
          <IconPlus size={16} />
          <span>Add Item</span>
        </div>
      </GhostButton>
    </div>
  );
}

/**
 * Example showcasing menu buttons (dropdown)
 */
export function ButtonExampleWithMenu(): React.ReactElement {
  const menuItems = [
    <Menu.MenuLinkItem key="1" to="#">
      Option 1
    </Menu.MenuLinkItem>,
    <Menu.MenuLinkItem key="2" to="#">
      Option 2
    </Menu.MenuLinkItem>,
    <Menu.MenuActionItem key="3" onClick={() => alert("Clicked Option 3")}>
      Option 3
    </Menu.MenuActionItem>,
  ];

  return (
    <div className="flex flex-wrap gap-4">
      <PrimaryButton options={menuItems}>
        <span>Menu Button</span>
      </PrimaryButton>
      <SecondaryButton options={menuItems}>
        <span>Menu Button</span>
      </SecondaryButton>
      <GhostButton options={menuItems}>
        <span>Menu Button</span>
      </GhostButton>
    </div>
  );
}

/**
 * Example showcasing link buttons
 */
export function ButtonExampleLinks(): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-4">
      <PrimaryButton linkTo="#primary">
        <span>Primary Link</span>
      </PrimaryButton>
      <SecondaryButton linkTo="#secondary">
        <span>Secondary Link</span>
      </SecondaryButton>
      <GhostButton linkTo="#ghost">
        <span>Ghost Link</span>
      </GhostButton>
      <PrimaryButton linkTo="#external" linkTarget="_blank">
        <span>External Link</span>
      </PrimaryButton>
    </div>
  );
}

/**
 * Example showcasing danger button variants
 */
export function ButtonExampleDanger(): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-4">
      <DangerButton>
        <span>Delete Item</span>
      </DangerButton>
      <DangerGhostButton>
        <span>Cancel Subscription</span>
      </DangerGhostButton>
    </div>
  );
}
