import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Companies from "@/models/companies";

import { DropdownMenu, DropdownLinkItem } from "./DropdownMenu";
import { encodeUrlParams } from "@/routes/paths";

const supportEmail = "support@operately.com";
const discordChatLink = "https://discord.gg/SGnvguhV";
const newsLink = "https://operately.com/releases";
const roadmap = "https://operately.com/roadmap";

const DiscordIcon = Icons.IconBrandDiscordFilled;

export function HelpDropdown({ company }: { company: Companies.Company }) {
  return (
    <DropdownMenu testId="help-dropdown" name="Help" icon={Icons.IconLifebuoy} align="center" minWidth={200}>
      <DropdownLinkItem path={contactUsLink(company)} icon={Icons.IconMail} title="Contact us" />
      <DropdownLinkItem path={discordChatLink} icon={DiscordIcon} title="Discord chat" target="_blank" />
      <DropdownLinkItem path={newsLink} icon={Icons.IconSpeakerphone} title="What's new" target="_blank" />
      <DropdownLinkItem path={roadmap} icon={Icons.IconMap2} title="Roadmap" target="_blank" />
    </DropdownMenu>
  );
}

function contactUsLink(company: Companies.Company) {
  const params = encodeUrlParams({
    body: "\n\norg name: " + company.name + "\norg id: " + company.id + "\n\n",
  });

  return `mailto:${supportEmail}` + params;
}
