import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as React from "react";

import { BlackLink, Link, SecondaryButton } from "turboui";

import { InfoCallout } from "@/components/Callouts";
import { PageModule } from "@/routes/types";
import { createTestId } from "@/utils/testid";
import { Avatar } from "turboui";

import { usePaths } from "@/routes/paths";
export default { name: "CompanyAdminRestoreSuspendedPeoplePage", loader, Page } as PageModule;

interface LoaderResult {
  company: Companies.Company;
  suspendedPeople: People.Person[];
}

async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({ id: params.companyId }).then((res) => res.company!);
  const people = await People.getPeople({ onlySuspended: true }).then((res) => res.people!);

  return {
    company: company,
    suspendedPeople: people,
  };
}

function Page() {
  const { company, suspendedPeople } = Pages.useLoadedData() as LoaderResult;

  return (
    <Pages.Page title={["Restore Deactivated Team Members", company.name!]} testId="restore-suspended-people-page">
      <Paper.Root size="medium">
        <Navigation />

        <Paper.Body>
          <Paper.Header title="Restore Deactivated Team Members" />

          {suspendedPeople.length === 0 ? <NoSuspenedPeopleMessage /> : <SuspendedPeopleList />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const paths = usePaths();
  return <Paper.Navigation items={[{ to: paths.companyAdminPath(), label: "Company Administration" }]} />;
}

function NoSuspenedPeopleMessage() {
  const paths = usePaths();
  const { company } = Pages.useLoadedData<LoaderResult>();

  return (
    <div className="max-w-xl mx-auto">
      <InfoCallout
        message={`No deactivated team members`}
        description={
          <p>
            There are no deactivated people in {company.name}. To remove access for departing team members, visit the{" "}
            <Link to={paths.companyManagePeopleListPath()}>Manage People</Link> page.
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
  const paths = usePaths();
  return (
    <div>
      <BlackLink to={paths.profilePath(person.id!)} className="font-bold" underline="hover">
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
      Reactivate Account
    </SecondaryButton>
  );
}
