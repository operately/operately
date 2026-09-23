import { loader, useLoadedData } from "./loader";
import * as Billing from "@/models/billing";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";

import {
  BillingLimitGuidanceNotice,
  BlackLink,
  InfoCallout,
  Link,
  SecondaryButton,
  showErrorToast,
  Page as TurboUIPage,
} from "turboui";
import { PageModule } from "@/routes/types";
import { includesId } from "@/routes/paths";
import { createTestId } from "@/utils/testid";
import { Avatar } from "turboui";

import { translationText } from "@/i18n";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { usePaths } from "@/routes/paths";
export default { name: "CompanyAdminRestoreSuspendedPeoplePage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const { company, ownerIds, suspendedPeople } = useLoadedData();
  const me = useMe();
  const paths = usePaths();
  const viewerRole: Billing.BillingLimitViewerRole = includesId(ownerIds, me?.id) ? "owner" : "company_admin";
  const [limitGuidance, setLimitGuidance] = React.useState<Billing.BillingLimitGuidance | null>(null);

  return (
    <>
      <TurboUIPage
        title={[translationText(t("Restore Deactivated Team Members")), company.name!]}
        size="medium"
        testId="restore-suspended-people-page"
        navigation={[{ to: paths.companyAdminPath(), label: t("Company Administration") }]}
      >
        <div className="px-12 py-10">
          <div className="mb-6">
            <div className="text-content-accent text-lg md:text-2xl font-extrabold">
              {t("Restore Deactivated Team Members")}
            </div>
          </div>

          {suspendedPeople.length === 0 ? (
            <NoSuspenedPeopleMessage />
          ) : (
            <SuspendedPeopleList onLimitError={setLimitGuidance} viewerRole={viewerRole} paths={paths} />
          )}
        </div>
      </TurboUIPage>

      {limitGuidance && (
        <BillingLimitGuidanceNotice isOpen={true} onClose={() => setLimitGuidance(null)} guidance={limitGuidance} />
      )}
    </>
  );
}

function NoSuspenedPeopleMessage() {
  const { t } = useTranslation();
  const paths = usePaths();
  const { company } = useLoadedData();

  return (
    <div className="max-w-xl mx-auto">
      <InfoCallout
        message={translationText(t("No deactivated team members"))}
        description={
          <p>
            <Trans
              i18nKey="There are no deactivated team members in {{companyName}}. To remove access for departing team members, visit the <link>Manage Team Members</link> page."
              values={{ companyName: company.name }}
              components={{ link: <Link to={paths.companyManagePeoplePath()} /> }}
            />
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
  const { suspendedPeople } = useLoadedData();

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
  const { t } = useTranslation();
  const { mutateAsync: restore, isPending: loading } = Companies.useRestoreCompanyMember();

  const handler = async () => {
    try {
      onLimitError(null);
      await restore({ personId: person.id! });
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

      showErrorToast(t("Unable to restore member"), typeof message === "string" ? message : t("Please try again."));
    }
  };

  return (
    <SecondaryButton size="xs" testId={createTestId("restore", person.id!)} onClick={handler} loading={loading}>
      {t("Reactivate Account")}
    </SecondaryButton>
  );
}
