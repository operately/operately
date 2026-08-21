import React from "react";

import Api, { Activity } from "@/api";
import { PageModule } from "@/routes/types";

import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";
import { getWorkMap } from "@/models/workMap";

export default { name: "HomePage", loader, Page } as PageModule;

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Feed, useItemsQuery } from "@/features/Feed";
import { includesId, usePaths } from "@/routes/paths";
import { HomePage, showErrorToast } from "turboui";
import { Navigate } from "react-router";
import { canDeleteFeedItems } from "./feedPermissions";
import { shouldOpenCompanyWorkMap } from "./firstRun";

interface LoaderData {
  company: Companies.Company;
  spaces: Spaces.Space[];
  adminIds: string[];
  ownerIds: string[];
  hasWorkItems: boolean;
}

async function loader(): Promise<LoaderData> {
  const company = await Companies.getCompany({
    includeOwners: true,
    includeAdmins: true,
    includePermissions: true,
  }).then((d) => d.company);

  const [spaces, hasWorkItems] = await Promise.all([
    Spaces.getSpaces({ includeAccessLevels: true }),
    company.setupCompleted ? Promise.resolve(false) : getWorkMap({}).then((data) => data.workMap.length > 0),
  ]);
  const adminIds = company.admins?.map((a) => a.id);
  const ownerIds = company.owners?.map((o) => o.id);

  return {
    company,
    spaces,
    adminIds: adminIds || [],
    ownerIds: ownerIds || [],
    hasWorkItems,
  };
}

function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}

function Page() {
  const paths = usePaths();
  const me = useMe()!;
  const { company, spaces, hasWorkItems } = useLoadedData();
  const isOwner = useIsOwner();

  if (
    shouldOpenCompanyWorkMap({
      isOwner,
      setupCompleted: company.setupCompleted,
      hasWorkItems,
    })
  ) {
    return <Navigate to={paths.workMapPath()} replace />;
  }

  const props: HomePage.Props = {
    firstName: People.firstName(me),
    spaces: spaces.map((space) => ({
      id: space.id!,
      name: space.name!,
      mission: space.mission,
      accessLevels: space.accessLevels,
      members: space.members ?? [],
      isCompanySpace: space.isCompanySpace,
      link: paths.spacePath(space.id!),
    })),
    canCreateSpace: company.permissions?.canCreateSpace || false,
    canInviteMembers: company.permissions?.canInviteMembers || false,
    newSpacePath: paths.newSpacePath(),
    invitePeoplePath: paths.invitePeoplePath(),
    activityFeed: <ActivityFeed />,
  };

  return <HomePage {...props} />;
}

function ActivityFeed() {
  const { company } = useLoadedData();
  const { data, loading, error } = useItemsQuery("company", company.id!);
  const canDeleteFeedItems = useCanDeleteFeedItems();
  const [deleteActivity] = Api.companies.useDeleteActivity();
  const [activities, setActivities] = React.useState(data?.activities || []);

  React.useEffect(() => {
    setActivities(data?.activities || []);
  }, [data?.activities]);

  const handleDeleteActivity = async (activity: Activity) => {
    if (!activity.id) return;

    try {
      await deleteActivity({ activityId: activity.id });
      setActivities((activities) => activities.filter((item) => item.id !== activity.id));
    } catch {
      showErrorToast("Could not delete feed item", "Please try again.");
    }
  };

  if (loading) return <ActivityFeedSkeleton />;
  if (error) return <div>Error</div>;

  return (
    <Feed
      items={activities}
      testId="company-feed"
      page="company"
      hideTopBorder
      paddedGroups
      canDeleteItems={canDeleteFeedItems}
      onDeleteItem={handleDeleteActivity}
    />
  );
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

function useIsOwner() {
  const { ownerIds } = useLoadedData();

  const me = useMe();
  return includesId(ownerIds, me!.id);
}

function useCanDeleteFeedItems() {
  const { adminIds, ownerIds } = useLoadedData();

  const me = useMe();
  return canDeleteFeedItems({ personId: me?.id, adminIds, ownerIds });
}
