import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Updates from "@/graphql/Projects/updates";

import { useLoadedData } from "./loader";
import { useDocumentTitle } from "@/layouts/header";
import { CheckInCard } from "@/components/CheckInCard";

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

        <UpdateList updates={updates} />
      </Paper.Body>
    </Paper.Root>
  );
}

function UpdateList({ updates }: { updates: Updates.Update[] }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      {updates.map((update) => (
        <CheckInCard update={update} key={update.id} />
      ))}
    </div>
  );
}
