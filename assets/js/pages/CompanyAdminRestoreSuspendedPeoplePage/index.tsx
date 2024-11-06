import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";

import { Paths } from "@/routes/paths";
import { SecondaryButton } from "@/components/Buttons";
import { BlackLink, Link } from "@/components/Link";

import Avatar from "@/components/Avatar";
import { createTestId } from "@/utils/testid";
import { InfoCallout } from "@/components/Callouts";

interface LoaderResult {
  company: Companies.Company;
  suspendedPeople: People.Person[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({ id: params.companyId }).then((res) => res.company!);
  const people = await People.getPeople({ onlySuspended: true }).then((res) => res.people!);

  return {
    company: company,
    suspendedPeople: people,
  };
}

export function Page() {
  const { company, suspendedPeople } = Pages.useLoadedData() as LoaderResult;

  return (
    <Pages.Page title={["Restore Suspended People", company.name!]} testId="restore-suspended-people-page">
      <Paper.Root size="medium">
        <Navigation />

        <Paper.Body>
          <Paper.Header
            title="Restore Suspended People"
            subtitle="Restore access for suspended users to re-enable their company access."
          />

          {suspendedPeople.length === 0 ? <NoSuspenedPeopleMessage /> : <SuspendedPeopleList />}
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

function NoSuspenedPeopleMessage() {
  const { company } = Pages.useLoadedData<LoaderResult>();

  return (
    <div className="max-w-xl mx-auto">
      <InfoCallout
        message={`No suspended people`}
        description={
          <p>
            There are no suspended people in {company.name}. Suspended people are users who have been removed from the
            company. If you want to suspend a user, go to the{" "}
            <Link to={Paths.companyManagePeoplePath()}>Manage People</Link> page.
          </p>
        }
      />
    </div>
  );
}

function SuspendedPeopleList() {
  const { suspendedPeople } = Pages.useLoadedData<LoaderResult>();

  return (
    <div>
      {suspendedPeople.map((person) => (
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
        <RestoreButton person={person} />
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
        <span className="text-sm"> &middot; </span>
        <span className="break-all mt-0.5">{person.email}</span>
      </div>
    </div>
  );
}

function RestoreButton({ person }: { person: People.Person }) {
  const [restore, { loading }] = Companies.useRestoreCompanyMember();
  const refresh = Pages.useRefresh();

  const handler = async () => {
    await restore({ personId: person.id! });
    refresh();
  };

  return (
    <SecondaryButton size="xs" testId={createTestId("restore", person.id!)} onClick={handler} loading={loading}>
      Restore
    </SecondaryButton>
  );
}
