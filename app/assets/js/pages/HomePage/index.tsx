import Api from "@/api";
import React from "react";

import { PageModule } from "@/routes/types";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";

export default { name: "HomePage", loader, Page } as PageModule;

import { SpaceCardGrid, SpaceCardLink } from "@/features/spaces/SpaceCards";

const MARKO_IMAGE_URL = ""; //new URL("../../../static/marko.jpg", import.meta.url).toString();

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Feed, useItemsQuery } from "@/features/Feed";
import { includesId, usePaths } from "@/routes/paths";
import { CompanyCreatorOnboardingWizard, GhostButton, PrimaryButton } from "turboui";

interface LoaderData {
  company: Companies.Company;
  spaces: Spaces.Space[];
  adminIds: string[];
  ownerIds: string[];
}

async function loader({ params }): Promise<LoaderData> {
  const company = await Companies.getCompany({
    id: params.companyId,
    includeOwners: true,
    includeAdmins: true,
  }).then((d) => d.company!);

  const spaces = await Spaces.getSpaces({ includeAccessLevels: true });
  const adminIds = company!.admins!.map((a) => a.id!);
  const ownerIds = company!.owners!.map((o) => o.id!);

  return {
    company,
    spaces,
    adminIds,
    ownerIds,
  };
}

function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}

function Page() {
  const { company, ownerIds } = useLoadedData();
  const me = useMe();
  const refresh = Pages.useRefresh();
  const [completeSetup, completeStatus] = Companies.useCompleteCompanySetup();

  const [hasDismissed, setHasDismissed] = React.useState(false);
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [invitationLink, setInvitationLink] = React.useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [inviteAttempted, setInviteAttempted] = React.useState(false);
  const [wizardError, setWizardError] = React.useState<string | null>(null);

  const isOwner = React.useMemo(() => includesId(ownerIds, me!.id), [ownerIds, me]);
  const shouldPromptOnboarding = isOwner && !company.setupCompleted;

  React.useEffect(() => {
    setHasDismissed(false);
    setInvitationLink(null);
    setInviteAttempted(false);
  }, [company.id]);

  const fetchInviteLink = React.useCallback(async () => {
    setInviteLoading(true);

    try {
      setWizardError(null);

      const response = await Api.invitations.createInviteLink({});
      const token = response.inviteLink?.token;

      if (!token) {
        throw new Error("Missing invitation token");
      }

      setInvitationLink(Companies.createInvitationUrl(token));
    } catch (error) {
      console.error("Failed to create invite link", error);
      setWizardError("We couldn't generate an invitation link. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }, [company.id]);

  React.useEffect(() => {
    setWizardOpen(shouldPromptOnboarding && !hasDismissed);
  }, [shouldPromptOnboarding, hasDismissed]);

  React.useEffect(() => {
    if (!wizardOpen) {
      setWizardError(null);
      setInvitationLink(null);
      setInviteAttempted(false);
      return;
    }
  }, [wizardOpen]);

  React.useEffect(() => {
    if (!wizardOpen) return;
    if (invitationLink || inviteLoading || inviteAttempted) return;

    setInviteAttempted(true);
    fetchInviteLink();
  }, [wizardOpen, invitationLink, inviteLoading, inviteAttempted, fetchInviteLink]);

  const handleWizardDismiss = React.useCallback(() => {
    setHasDismissed(true);
    setWizardOpen(false);
  }, []);

  const handleWizardComplete = React.useCallback(
    async (data: CompanyCreatorOnboardingWizard.OnCompleteData) => {
      if (completeStatus.loading) return;

      try {
        setWizardError(null);

        await completeSetup({ spaces: data.spaces });

        setHasDismissed(true);
        setWizardOpen(false);
        refresh();
      } catch (error) {
        console.error("Failed to complete company setup", error);
        setWizardError("We couldn't finish setting up your workspace. Please try again.");
      }
    },
    [completeStatus.loading, completeSetup, refresh],
  );

  return (
    <Pages.Page title="Home" testId="company-home">
      {wizardOpen && (
        <>
          <CompanyCreatorOnboardingWizard
            invitationLink={invitationLink}
            markoImageUrl={MARKO_IMAGE_URL}
            onComplete={handleWizardComplete}
            onDismiss={handleWizardDismiss}
            isCompleting={completeStatus.loading}
          />

          {wizardError && (
            <div className="fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
              <div className="max-w-xl rounded-lg bg-red-500 px-4 py-2 text-white shadow-lg">{wizardError}</div>
            </div>
          )}
        </>
      )}

      <Paper.Root size="medium">
        <Greeting />
        <SpacesSection />
        <FeedSection />
      </Paper.Root>
    </Pages.Page>
  );
}

function SpacesSection() {
  const { spaces } = useLoadedData();

  return (
    <div className="mt-8">
      <Paper.Section
        title="Your Operately Spaces"
        subtitle="Manage projects, track goals, and organize your team's work."
        actions={
          <div className="flex gap-2">
            <InvitePeopleButton />
            <AddSpaceButton />
          </div>
        }
      >
        <SpaceGrid spaces={spaces} />
      </Paper.Section>
    </div>
  );
}

function FeedSection() {
  return (
    <div className="mt-8">
      <Paper.Section title="What's new?" subtitle="Stay up to date with your team's progress.">
        <div className="bg-surface-base shadow rounded-2xl">
          <ActivityFeed />
        </div>
      </Paper.Section>
    </div>
  );
}

function ActivityFeed() {
  const { company } = useLoadedData();
  const { data, loading, error } = useItemsQuery("company", company.id!);

  if (loading) return <ActivityFeedSkeleton />;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="company-feed" page="company" hideTopBorder paddedGroups />;
}

function ActivityFeedSkeleton() {
  return (
    <div className="w-full p-8">
      {/* Simulate 2 activity groups */}
      <ActivityGroupSkeleton />
      <ActivityGroupSkeleton />
    </div>
  );
}

function ActivityGroupSkeleton() {
  return (
    <div className="w-full border-t border-stroke-base animate-pulse flex flex-col sm:flex-row items-start gap-2 py-4">
      {/* Date section skeleton */}
      <div className="w-1/5 shrink-0 mb-2">
        <div className="h-4 bg-surface-dimmed rounded animate-pulse mb-1"></div>
        <div className="h-3 bg-surface-dimmed rounded animate-pulse w-3/4"></div>
      </div>

      {/* Activity items skeleton */}
      <div className="flex-1 flex flex-col gap-4">
        <ActivityItemSkeleton />
        <ActivityItemSkeleton />
        <ActivityItemSkeleton />
      </div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex flex-1 gap-3">
      {/* Avatar skeleton */}
      <div className="w-8 h-8 bg-surface-dimmed rounded-full animate-pulse"></div>

      {/* Content skeleton */}
      <div className="w-full break-words -mt-0.5">
        <div className="h-4 bg-surface-dimmed rounded animate-pulse mb-1 w-3/4"></div>
        <div className="h-3 bg-surface-dimmed rounded animate-pulse w-1/2"></div>
      </div>
    </div>
  );
}

function AddSpaceButton() {
  const paths = usePaths();

  return (
    <PrimaryButton linkTo={paths.newSpacePath()} testId="add-space" size="sm">
      Add Space
    </PrimaryButton>
  );
}

function InvitePeopleButton() {
  const paths = usePaths();
  const { adminIds, ownerIds } = useLoadedData();

  const me = useMe();
  const amIAdmin = includesId(adminIds, me!.id);
  const amIOwner = includesId(ownerIds, me!.id);

  if (!(amIAdmin || amIOwner)) {
    return null;
  }

  return (
    <GhostButton linkTo={paths.companyManagePeoplePath()} testId="invite-people" size="sm">
      Invite People
    </GhostButton>
  );
}

function Greeting() {
  const me = useMe();

  let hour = new Date().getHours();
  let greeting = "";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  return (
    <p className="font-bold text-3xl mt-20">
      {greeting}, {People.firstName(me!)}!
    </p>
  );
}

function SpaceGrid({ spaces }: { spaces: Spaces.Space[] }) {
  const sorted = [...spaces].sort((a, b) => {
    if (a.isCompanySpace) return -1;

    return a.name!.localeCompare(b.name!);
  });

  return (
    <SpaceCardGrid>
      {sorted.map((space) => (
        <SpaceCardLink key={space.id} space={space} />
      ))}
    </SpaceCardGrid>
  );
}
