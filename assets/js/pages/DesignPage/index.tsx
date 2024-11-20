import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { Colors } from "./Colors";
import { Links } from "./Links";
import { Buttons } from "./Buttons";
import { Tooltips } from "./Tooltips";
import { Menus } from "./Menus";
import { CalloutExamples } from "./Callouts";
import { FormExamples } from "./Forms";
import { Avatars } from "./Avatars";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={"Design System"}>
      <Paper.Root size="large">
        <Paper.NavigateBack to={"/"} title="Back to the Lobby" />
        <Paper.Body>
          <TitleRow />
          <Colors />
          <Links />
          <Buttons />
          <Menus />
          <Tooltips />
          <CalloutExamples />
          <FormExamples />
          <Avatars />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function TitleRow() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <OperatelyLogo width="30px" height="30px" />
      <div className="text-content-accent text-2xl font-semibold">Operately Design System</div>
    </div>
  );
}
