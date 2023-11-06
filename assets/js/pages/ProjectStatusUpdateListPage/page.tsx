import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { useDocumentTitle } from "@/layouts/header";

export function Page() {
  const { project, updates } = useLoadedData();

  useDocumentTitle([project.name, "Check-Ins"]);

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="text-white-1 text-2xl font-extrabold">Check-Ins</div>
      </Paper.Body>
    </Paper.Root>
  );
}
