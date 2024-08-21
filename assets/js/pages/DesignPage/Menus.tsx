import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { Menu, MenuItem } from "@/components/Menu";
import { Section, SectionTitle } from "./Section";

export function Menus() {
  return (
    <Section>
      <SectionTitle>Menus</SectionTitle>

      <div className="max-w-2xl mt-2 mb-10">
        Operately uses menus for actions that are not immediately useful for the user on a given page. Every menu item
        must have a clear and concise label and an icon if necessary. The menu should be placed in the top-right corner
        of the screen, or on the right side list items.
      </div>

      <div className="border-b border-stroke-base">
        <div className="flex items-center justify-between py-3 border-t border-stroke-base">
          <div>Simple menu</div>
          <div>
            <Menu>
              <MenuItem icon={Icons.IconEdit}>Edit</MenuItem>
              <MenuItem icon={Icons.IconCopy}>Copy</MenuItem>
            </Menu>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-stroke-base">
          <div>Dangerous menu items</div>
          <div>
            <Menu>
              <MenuItem icon={Icons.IconEdit}>Edit</MenuItem>
              <MenuItem icon={Icons.IconTrash} danger>
                Delete
              </MenuItem>
            </Menu>
          </div>
        </div>
      </div>
    </Section>
  );
}
