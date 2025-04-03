import React from "react";
import { Menu } from "./index";
const { SubMenu, MenuLinkItem, MenuActionItem } = Menu;
import { IconUserCircle, IconEdit, IconTrash } from "./icons";

export function MenuExampleBasic() {
  return (
    <Menu>
      <MenuLinkItem to="#" icon={IconUserCircle}>
        View Profile
      </MenuLinkItem>
      <MenuLinkItem to="#" icon={IconEdit}>
        Edit Profile
      </MenuLinkItem>
      <MenuActionItem onClick={() => alert("Clicked settings")} icon={IconEdit}>
        Settings
      </MenuActionItem>
      <MenuActionItem onClick={() => alert("Clicked delete")} danger icon={IconTrash}>
        Delete
      </MenuActionItem>
    </Menu>
  );
}

export function MenuExampleWithSizes() {
  return (
    <div className="flex gap-8 items-start">
      <div>
        <div className="mb-2 text-sm font-medium text-content-dimmed">Small</div>
        <Menu size="small">
          <MenuLinkItem to="#">Option 1</MenuLinkItem>
          <MenuLinkItem to="#">Option 2</MenuLinkItem>
          <MenuLinkItem to="#">Option 3</MenuLinkItem>
        </Menu>
      </div>
      
      <div>
        <div className="mb-2 text-sm font-medium text-content-dimmed">Medium (Default)</div>
        <Menu size="medium">
          <MenuLinkItem to="#">Option 1</MenuLinkItem>
          <MenuLinkItem to="#">Option 2</MenuLinkItem>
          <MenuLinkItem to="#">Option 3</MenuLinkItem>
        </Menu>
      </div>
      
      <div>
        <div className="mb-2 text-sm font-medium text-content-dimmed">Large</div>
        <Menu size="large">
          <MenuLinkItem to="#">Option 1</MenuLinkItem>
          <MenuLinkItem to="#">Option 2</MenuLinkItem>
          <MenuLinkItem to="#">Option 3</MenuLinkItem>
        </Menu>
      </div>
    </div>
  );
}

export function MenuExampleWithCustomTrigger() {
  return (
    <Menu
      customTrigger={
        <button className="bg-content-accent hover:bg-link-hover text-surface-base font-bold py-2 px-4 rounded border border-surface-outline">
          Custom Trigger
        </button>
      }
    >
      <MenuLinkItem to="#">Option 1</MenuLinkItem>
      <MenuLinkItem to="#">Option 2</MenuLinkItem>
      <MenuLinkItem to="#">Option 3</MenuLinkItem>
    </Menu>
  );
}

export function MenuExampleWithSubmenu() {
  return (
    <Menu>
      <MenuLinkItem to="#" icon={IconEdit}>
        Edit Profile
      </MenuLinkItem>
      <SubMenu label="More Options" icon={IconUserCircle}>
        <MenuLinkItem to="#">Submenu Option 1</MenuLinkItem>
        <MenuLinkItem to="#">Submenu Option 2</MenuLinkItem>
        <MenuLinkItem to="#">Submenu Option 3</MenuLinkItem>
      </SubMenu>
      <MenuActionItem onClick={() => alert("Clicked delete")} danger icon={IconTrash}>
        Delete
      </MenuActionItem>
    </Menu>
  );
}
