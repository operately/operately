import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import { PageModule } from "@/routes/types";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import { DivLink } from "turboui";

export default { name: "DesignPage", loader: Pages.emptyLoader, Page } as PageModule;

const subpages = [
  { title: "Buttons", path: "/__design__/buttons", icon: Icons.IconHandClick },
  { title: "Colors", path: "/__design__/colors", icon: Icons.IconPalette },
  { title: "Menus", path: "/__design__/menus", icon: Icons.IconMenu2 },
  { title: "Tooltips", path: "/__design__/tooltips", icon: Icons.IconMessageCircle },
  { title: "Callouts", path: "/__design__/callouts", icon: Icons.IconAlertTriangle },
  { title: "Forms", path: "/__design__/forms", icon: Icons.IconFileText },
  { title: "Progress Bars", path: "/__design__/progress", icon: Icons.IconChartPie },
];

function Page() {
  return (
    <Pages.Page title={"Design System"}>
      <Paper.Root size="tiny">
        <Paper.Navigation items={[{ to: "/", label: "Lobby" }]} />
        <Paper.Body>
          <TitleRow />
          <Links />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Links() {
  return (
    <div>
      {subpages.map((subpage) => (
        <DivLink
          to={subpage.path}
          key={subpage.title}
          className="p-2 first:border-t border-b border-stroke-base cursor-pointer flex items-center gap-4 hover:bg-surface-highlight"
        >
          {React.createElement(subpage.icon!, { size: 16 })}
          {subpage.title}
        </DivLink>
      ))}
    </div>
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
