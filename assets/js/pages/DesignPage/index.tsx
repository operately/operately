import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Logo } from "@/layouts/DefaultLayout/Logo";
import { Link } from "@/components/Link";

import { Colors } from "./Colors";
import { Links } from "./Links";
import { Buttons } from "./Buttons";
import { Menus } from "./Menus";
import { CalloutExamples } from "./Callouts";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={"Design System"}>
      <Paper.Root size="large">
        <BackToLobbyLink />
        <Paper.Body>
          <TitleRow />
          <Colors />
          <Links />
          <Buttons />
          <Menus />
          <CalloutExamples />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function BackToLobbyLink() {
  return (
    <div className="flex items-center mb-4 mt-12">
      <Link to={"/"}>
        <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
        Back to the Lobby
      </Link>
    </div>
  );
}

function TitleRow() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <Logo width="30px" height="30px" />
      <div className="text-content-accent text-2xl font-semibold">Operately Design System</div>
    </div>
  );
}
