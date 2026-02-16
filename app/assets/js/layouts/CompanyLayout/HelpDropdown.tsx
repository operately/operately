import * as Companies from "@/models/companies";
import * as React from "react";

import { encodeUrlParams } from "@/routes/paths";
import { IconBrandDiscordFilled, IconLifebuoy, IconMail, IconMap2, IconSpeakerphone } from "turboui";
import { DropdownLinkItem, DropdownMenu } from "./DropdownMenu";

const supportEmail = "support@operately.com";
const newsLink = "https://operately.com/releases";
const roadmap = "https://operately.com/roadmap";

const DiscordIcon = IconBrandDiscordFilled;

export function HelpDropdown({ company }: { company: Companies.Company }) {
  return (
    <DropdownMenu
      testId="help-dropdown"
      name="Help"
      icon={IconLifebuoy}
      align="center"
      minWidth={200}
      triggerClassName="hidden lg:flex"
    >
      <DropdownLinkItem path={contactUsLink(company)} icon={IconMail} title="Contact us" />
      <DropdownLinkItem path={window.appConfig!.discordUrl} icon={DiscordIcon} title="Discord chat" target="_blank" />
      <DropdownLinkItem path={newsLink} icon={IconSpeakerphone} title="What's new" target="_blank" />
      <DropdownLinkItem path={roadmap} icon={IconMap2} title="Roadmap" target="_blank" />
    </DropdownMenu>
  );
}

function contactUsLink(company: Companies.Company) {
  const params = encodeUrlParams({
    body: "\n\norg name: " + company.name + "\norg id: " + company.id + "\n\n",
  });

  return `mailto:${supportEmail}` + params;
}
