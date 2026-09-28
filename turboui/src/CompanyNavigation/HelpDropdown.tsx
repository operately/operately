import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <DropdownMenu
      testId="help-dropdown"
      name={t("Help")}
      icon={IconLifebuoy}
      align="center"
      minWidth={220}
      triggerClassName="hidden lg:flex"
    >
      <DropdownActionItem
        icon={IconQuestionMark}
        title={t("Keyboard shortcuts")}
        onClick={onOpenKeyboardShortcuts}
        testId="keyboard-shortcuts-menu-item"
      />
      <DropdownSeparator />
      <DropdownLinkItem path={contactUsHref} icon={IconMail} title={t("Contact us")} />
      <DropdownLinkItem path={discordUrl} icon={IconBrandDiscordFilled} title={t("Discord chat")} target="_blank" />
      <DropdownLinkItem path={newsLink} icon={IconSpeakerphone} title={t("What's new")} target="_blank" />
      <DropdownLinkItem path={roadmap} icon={IconMap2} title={t("Roadmap")} target="_blank" />
    </DropdownMenu>
  );
}
