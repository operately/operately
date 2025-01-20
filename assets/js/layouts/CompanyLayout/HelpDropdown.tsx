import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Companies from "@/models/companies";

import { DropdownMenu, DropdownLinkItem } from "./DropdownMenu";
import { encodeUrlParams } from "@/routes/paths";

const discordChatLink = "https://discord.gg/SGnvguhV";
const newsLink = "https://operately.com/releases";
const roadmap = "https://operately.com/roadmap";

export function HelpDropdown({ company }: { company: Companies.Company }) {
  return (
    <DropdownMenu testId="help-dropdown" name="Help" icon={Icons.IconLifebuoy} align="center" minWidth={200}>
      <DropdownLinkItem path={contactUsLink(company)} icon={Icons.IconMail} title="Contact us" />
      <DropdownLinkItem path={discordChatLink} icon={Icons.IconBrandDiscordFilled} title="Discord chat" />
      <DropdownLinkItem path={newsLink} icon={Icons.IconSpeakerphone} title="What's new" />
      <DropdownLinkItem path={roadmap} icon={Icons.IconMap2} title="Roadmap" />
    </DropdownMenu>
  );
}

const supportEmail = "support@operately.com";

function contactUsLink(company: Companies.Company) {
  const params = encodeUrlParams({
    body: "\n\norg name: " + company.name + "\norg id: " + company.id + "\n\n",
  });

  return `mailto:${supportEmail}` + params;
}
