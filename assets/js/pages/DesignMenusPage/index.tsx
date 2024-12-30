import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Menu, MenuLinkItem, MenuActionItem, SubMenu } from "@/components/Menu";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={"Menus"}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo="/__design__">Lobby</Paper.NavItem>
          <Paper.NavSeparator />
          <Paper.NavItem linkTo="/__design__">Design System</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Paper.Header title="Menus" />

          <div className="mt-2 mb-10">
            Operately uses menus for actions that are not immediately useful for the user on a given page. Every menu
            item must have a clear and concise label and an icon if necessary. The menu should be placed in the
            top-right corner of the screen, or on the right side list items.
          </div>

          <div className="border-b border-stroke-base">
            <div className="flex items-center justify-between py-3 border-t border-stroke-base">
              <div>Simple menu</div>
              <div>
                <Menu>
                  <MenuLinkItem to="" icon={Icons.IconEdit}>
                    Edit
                  </MenuLinkItem>
                  <MenuLinkItem to="" icon={Icons.IconCopy}>
                    Copy
                  </MenuLinkItem>
                </Menu>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-stroke-base">
              <div>Dangerous menu items</div>
              <div>
                <Menu>
                  <MenuLinkItem to="" icon={Icons.IconEdit}>
                    Edit
                  </MenuLinkItem>
                  <MenuLinkItem to="" icon={Icons.IconTrash} danger>
                    Delete
                  </MenuLinkItem>
                </Menu>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-stroke-base">
              <div>Menu with submenus</div>
              <div>
                <Menu>
                  <MenuLinkItem to="" icon={Icons.IconEdit}>
                    Edit
                  </MenuLinkItem>

                  <SubMenu label="Access Level" icon={Icons.IconLock}>
                    <MenuActionItem onClick={() => null}>Full Access</MenuActionItem>
                    <MenuActionItem onClick={() => null}>Edit Access</MenuActionItem>
                    <MenuActionItem onClick={() => null}>View Access</MenuActionItem>
                  </SubMenu>

                  <MenuLinkItem to="" icon={Icons.IconTrash} danger>
                    Delete
                  </MenuLinkItem>
                </Menu>
              </div>
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
