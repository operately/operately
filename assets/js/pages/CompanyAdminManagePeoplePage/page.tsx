import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { PeopleList } from "./PeopleList";
import { AddPeopleButton } from "./AddPeopleButton";
import { Paths } from "@/routes/paths";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={["Manage People", company.name]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={Paths.companyAdminPath()}>Company Administration</Paper.NavItem>
        </Paper.Navigation>
        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold text-center leading-none">
            People in {company.name}
          </div>

          <AddPeopleButton />
          <PeopleList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
