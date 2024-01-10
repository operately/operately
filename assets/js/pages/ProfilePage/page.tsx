import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import Avatar from "@/components/Avatar";

export function Page() {
  const { person } = useLoadedData();

  return (
    <Pages.Page title={"ProfilePage"}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/people`}>People</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <div className="flex items-center gap-4">
            <Avatar person={person} size={72} />
            <div className="flex flex-col">
              <div className="text-xl font-bold">{person.fullName}</div>
              <div className="font-medium">{person.title}</div>
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
