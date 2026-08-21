import React from "react";

import { IconBrandDiscordFilled, IconLifebuoy, IconMail, IconMap2, IconQuestionMark, IconSpeakerphone } from "../icons";
import { DropdownActionItem, DropdownLinkItem, DropdownMenu, DropdownSeparator } from "./DropdownMenu";

const newsLink = "https://operately.com/releases";
const roadmap = "https://operately.com/roadmap";

export function HelpDropdown({
  contactUsHref,
  discordUrl,
  onOpenKeyboardShortcuts,
}: {
  contactUsHref: string;
  discordUrl: string;
  onOpenKeyboardShortcuts: () => void;
}) {
  return (
    <DropdownMenu
      testId="help-dropdown"
      name="Help"
      icon={IconLifebuoy}
      align="center"
      minWidth={220}
      triggerClassName="hidden lg:flex"
    >
      <DropdownActionItem
        icon={IconQuestionMark}
        title="Keyboard shortcuts"
        onClick={onOpenKeyboardShortcuts}
        testId="keyboard-shortcuts-menu-item"
      />
      <DropdownSeparator />
      <DropdownLinkItem path={contactUsHref} icon={IconMail} title="Contact us" />
      <DropdownLinkItem path={discordUrl} icon={IconBrandDiscordFilled} title="Discord chat" target="_blank" />
      <DropdownLinkItem path={newsLink} icon={IconSpeakerphone} title="What's new" target="_blank" />
      <DropdownLinkItem path={roadmap} icon={IconMap2} title="Roadmap" target="_blank" />
    </DropdownMenu>
  );
}
