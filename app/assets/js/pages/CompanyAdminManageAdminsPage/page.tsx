import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as React from "react";

import { compareIds } from "@/routes/paths";
import { AddAdminsModal } from "./AddAdminsModal";
import { AddOwnersModal } from "./AddOwnersModal";
import { useLoadedData } from "./loader";
import { useFrom } from "./useForm";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { createTestId } from "@/utils/testid";
import { Avatar, BlackLink, SecondaryButton } from "turboui";

import { usePaths } from "@/routes/paths";
export function Page() {
  const paths = usePaths();
  const form = useFrom();

  const { admins, owners } = useLoadedData();

  return (
    <Pages.Page title={"Manage admins and owners"} testId="manage-admins-page">
      <Paper.Root>
        <Paper.Navigation items={[{ to: paths.companyAdminPath(), label: "Company Administration" }]} />

        <Paper.Body>
          <Paper.Header
            title="Manage admins and owners"
            subtitle="Add/Remove people who are in charge of the company and its operations"
          />

          <Paper.Section
            title="Administrators"
            subtitle="Company administrators can add/remove people from the company, manage their profiles, update company settings, and more."
            actions={<AddAdminsModal form={form} />}
            children={<PeopleList type="admins" people={admins} />}
          />

          <Paper.Section
            title="Account Owners"
            subtitle="Owners have the highest level of access and can manage all aspects of the company, including billing, and have access to all resources."
            actions={<AddOwnersModal form={form} />}
            children={<PeopleList type="owners" people={owners} />}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PeopleList({ people, type }: { people: People.Person[]; type: "admins" | "owners" }) {
  return (
    <div>
      {people.map((person) => (
        <PersonRow key={person.id!} person={person} type={type} />
      ))}
    </div>
  );
}

function PersonRow({ person, type }: { person: People.Person; type: "admins" | "owners" }) {
  return (
    <div className="flex items-center justify-between border-t border-stroke-dimmed py-4 last:border-b">
      <div className="flex items-center gap-4">
        <Avatar person={person} size={48} />
        <PersonInfo person={person} />
      </div>

      <div className="flex gap-2 items-center">
        <PersonActions person={person} type={type} />
      </div>
    </div>
  );
}

function PersonInfo({ person }: { person: People.Person }) {
  const paths = usePaths();
  return (
    <div>
      <BlackLink to={paths.profilePath(person.id!)} className="font-bold" underline="hover">
        {person.fullName}
      </BlackLink>

      <div className="text-content-dimmed text-sm">
        <span className="text-sm">{person.title}</span>
      </div>
    </div>
  );
}

function PersonActions({ person, type }: { person: People.Person; type: "admins" | "owners" }) {
  return (
    <div className="flex items-center gap-4">
      <RemoveAction person={person} type={type} />
    </div>
  );
}

function RemoveAction({ person, type }: { person: People.Person; type: "admins" | "owners" }) {
  const me = useMe();
  const refresh = Pages.useRefresh();

  const [removeAdmin] = Companies.useRemoveCompanyAdmin();
  const [removeOwner] = Companies.useRemoveCompanyOwner();

  const handle = async () => {
    if (type === "admins") await removeAdmin({ personId: person.id });
    if (type === "owners") await removeOwner({ personId: person.id });

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
