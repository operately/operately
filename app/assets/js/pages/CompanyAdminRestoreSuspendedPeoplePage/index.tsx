import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Billing from "@/models/billing";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as React from "react";

import { BillingLimitGuidanceNotice, BlackLink, InfoCallout, Link, SecondaryButton, showErrorToast } from "turboui";
import { PageModule } from "@/routes/types";
import { includesId } from "@/routes/paths";
import { createTestId } from "@/utils/testid";
import { Avatar } from "turboui";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { usePaths } from "@/routes/paths";
export default { name: "CompanyAdminRestoreSuspendedPeoplePage", loader, Page } as PageModule;

interface LoaderResult {
  company: Companies.Company;
  ownerIds: string[];
  suspendedPeople: People.Person[];
}

async function loader(): Promise<LoaderResult> {
  const company = await Companies.getCompany({ includeOwners: true }).then((res) => res.company!);
  const people = await People.getPeople({ onlySuspended: true }).then((res) => res.people!);

  return {
    company: company,
    ownerIds: company.owners?.map((owner) => owner.id) || [],
    suspendedPeople: people,
  };
}

function Page() {
  const { company, ownerIds, suspendedPeople } = Pages.useLoadedData() as LoaderResult;
  const me = useMe();
  const paths = usePaths();
  const viewerRole: Billing.BillingLimitViewerRole = includesId(ownerIds, me?.id) ? "owner" : "company_admin";
  const [limitGuidance, setLimitGuidance] = React.useState<Billing.BillingLimitGuidance | null>(null);

  return (
    <Pages.Page title={["Restore Deactivated Team Members", company.name!]} testId="restore-suspended-people-page">
      <>
        <Paper.Root size="medium">
          <Navigation />

          <Paper.Body>
            <Paper.Header title="Restore Deactivated Team Members" />

            {suspendedPeople.length === 0 ? (
              <NoSuspenedPeopleMessage />
            ) : (
              <SuspendedPeopleList onLimitError={setLimitGuidance} viewerRole={viewerRole} paths={paths} />
            )}
          </Paper.Body>
        </Paper.Root>

        {limitGuidance && <BillingLimitGuidanceNotice isOpen={true} onClose={() => setLimitGuidance(null)} guidance={limitGuidance} />}
      </>
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
            There are no deactivated team members in {company.name}. To remove access for departing team members, visit the{" "}
            <Link to={paths.companyManagePeoplePath()}>Manage Team Members</Link> page.
          </p>
        }
      />
    </div>
  );
}

function SuspendedPeopleList({
  onLimitError,
  viewerRole,
  paths,
}: {
  onLimitError: React.Dispatch<React.SetStateAction<Billing.BillingLimitGuidance | null>>;
  viewerRole: Billing.BillingLimitViewerRole;
  paths: ReturnType<typeof usePaths>;
}) {
  const { suspendedPeople } = Pages.useLoadedData<LoaderResult>();

  return (
    <div>
      {suspendedPeople.map((person) => (
        <PersonRow key={person.id!} person={person} onLimitError={onLimitError} viewerRole={viewerRole} paths={paths} />
      ))}
    </div>
  );
}

function PersonRow({
  person,
  onLimitError,
  viewerRole,
  paths,
}: {
  person: People.Person;
  onLimitError: React.Dispatch<React.SetStateAction<Billing.BillingLimitGuidance | null>>;
  viewerRole: Billing.BillingLimitViewerRole;
  paths: ReturnType<typeof usePaths>;
}) {
  return (
    <div className="flex items-center justify-between border-t border-stroke-dimmed py-4 last:border-b">
      <div className="flex items-center gap-4">
        <Avatar person={person} size={48} />
        <PersonInfo person={person} />
      </div>

      <div className="flex gap-2 items-center">
        <RestoreButton person={person} onLimitError={onLimitError} viewerRole={viewerRole} paths={paths} />
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

function RestoreButton({
  person,
  onLimitError,
  viewerRole,
  paths,
}: {
  person: People.Person;
  onLimitError: React.Dispatch<React.SetStateAction<Billing.BillingLimitGuidance | null>>;
  viewerRole: Billing.BillingLimitViewerRole;
  paths: ReturnType<typeof usePaths>;
}) {
  const [restore, { loading }] = Companies.useRestoreCompanyMember();
  const refresh = Pages.useRefresh();

  const handler = async () => {
    try {
      onLimitError(null);
      await restore({ personId: person.id! });
      refresh();
    } catch (error) {
      console.error(error);

      const limitError = Billing.extractLimitError(error);

      if (limitError?.code === "member_count_limit_exceeded") {
        onLimitError(
          Billing.buildMemberLimitGuidance(limitError, viewerRole, {
            companyBillingPath: () => paths.companyBillingPath(),
            companyBillingPlansPath: (opts) => paths.companyBillingPlansPath(opts),
          }),
        );
        return;
      }

      const message = (error as any)?.response?.data?.message;

      showErrorToast("Unable to restore member", typeof message === "string" ? message : "Please try again.");
    }
  };

  return (
    <SecondaryButton size="xs" testId={createTestId("restore", person.id!)} onClick={handler} loading={loading}>
      Reactivate Account
    </SecondaryButton>
  );
}
