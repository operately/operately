import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";

import { useLoadedData } from "./loader";
import { useFrom } from "./useForm";
import { Paths, compareIds } from "@/routes/paths";
import { AddOwnersModal } from "./AddOwnersModal";
import { AddAdminsModal } from "./AddAdminsModal";

import Avatar from "@/components/Avatar";
import { BlackLink } from "@/components/Link";
import { SecondaryButton } from "@/components/Buttons";
import { useMe } from "@/contexts/CurrentUserContext";
import { createTestId } from "@/utils/testid";

export function Page() {
  const form = useFrom();

  const { admins, owners } = useLoadedData();

  return (
    <Pages.Page title={"Manage admins and owners"} testId="manage-admins-page">
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={Paths.companyAdminPath()}>Company Administration</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Paper.Header
            title="Manage admins and owners"
            subtitle="Add/Remove people who are in charge of the company and its operations"
          />

          <Paper.Section
            title="Administrators"
            subtitle="Company administrators can add/remove people from the company, manage their profiles, update company settings, and more."
            actions={<AddAdminsModal form={form} />}
            children={<PeopleList people={admins} />}
          />

          <Paper.Section
            title="Account Owners"
            subtitle="Owners have the highest level of access and can manage all aspects of the company, including billing, and have access to all resources."
            actions={<AddOwnersModal form={form} />}
            children={<PeopleList people={owners} />}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PeopleList({ people }: { people: People.Person[] }) {
  return (
    <div>
      {people.map((person) => (
        <PersonRow key={person.id!} person={person} />
      ))}
    </div>
  );
}

function PersonRow({ person }: { person: People.Person }) {
  return (
    <div className="flex items-center justify-between border-t border-stroke-dimmed py-4 last:border-b">
      <div className="flex items-center gap-4">
        <Avatar person={person} size={48} />
        <PersonInfo person={person} />
      </div>

      <div className="flex gap-2 items-center">
        <PersonActions person={person} />
      </div>
    </div>
  );
}

function PersonInfo({ person }: { person: People.Person }) {
  return (
    <div>
      <BlackLink to={Paths.profilePath(person.id!)} className="font-bold" underline="hover">
        {person.fullName}
      </BlackLink>

      <div className="text-content-dimmed text-sm">
        <span className="text-sm">{person.title}</span>
      </div>
    </div>
  );
}

function PersonActions({ person }: { person: People.Person }) {
  return (
    <div className="flex items-center gap-4">
      <RemoveAction person={person} />
    </div>
  );
}

function RemoveAction({ person }: { person: People.Person }) {
  const me = useMe();
  const refresh = Pages.useRefresh();
  const [remove] = Companies.useRemoveCompanyMember();

  const handle = async () => {
    await remove({ personId: person.id });
    refresh();
  };

  if (compareIds(person.id, me!.id)) return null;

  return (
    <>
      <SecondaryButton onClick={handle} size="xs" testId={createTestId("remove", person.fullName!)}>
        Remove
      </SecondaryButton>
    </>
  );
}
