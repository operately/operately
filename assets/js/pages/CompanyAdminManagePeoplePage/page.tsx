import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { PeopleList } from "./PeopleList";
import { Paths } from "@/routes/paths";
import { FilledButton } from "@/components/Button";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={["Manage People", company.name!]}>
      <Paper.Root size="large">
        <Navigation />

        <Paper.Body>
          <Header />
          <PeopleList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.companyAdminPath()}>Company Administration</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Header() {
  return (
    <div className="flex items-start justify-between">
      <Title />
      <AddMemberButton />
    </div>
  );
}

function Title() {
  return (
    <div>
      <div className="text-content-accent text-3xl font-extrabold leading-none">People Management</div>
      <div className="mt-2">Invite new members, edit profiles, or remove members from the company.</div>
    </div>
  );
}

function AddMemberButton() {
  const addPeoplePath = Paths.companyManagePeopleAddPeoplePath();

  return (
    <FilledButton type="primary" linkTo={addPeoplePath} testId="add-person">
      Invite a new member
    </FilledButton>
  );
}
