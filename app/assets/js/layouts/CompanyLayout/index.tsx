import * as React from "react";

import { CompanyNavigation } from "turboui";

import { logOut } from "@/routes/auth";
import { Outlet, useNavigate } from "react-router";

import { KeyboardShortcutsModal, useKeyboardShortcutsModal } from "./KeyboardShortcutsModal";

import { useRefresh } from "@/components/Pages";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { DevBar } from "@/features/DevBar";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";
import * as Billing from "@/models/billing";
import { useAssignmentsCount, useReviewRefreshSignal } from "@/models/assignments";
import * as Notifications from "@/models/notifications";
import { encodeUrlParams, Paths, usePaths } from "@/routes/paths";
import { companySearchPathBuilder, useGlobalSearchHandler } from "./useGlobalSearch";
import { useProductRelease } from "@/models/productReleases/useProductRelease";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { toAvailableUpdate } from "@/utils/versions";
import { BillingDangerBanner } from "./BillingDangerBanner";
import { ProductReleaseAnnouncementBanner } from "./ProductReleaseAnnouncementBanner";
import { SiteMessageBanner } from "./SiteMessageBanner";
import { SupportSessionBanner } from "./SupportSessionBanner";

export default function CompanyLayout() {
  const outletDiv = React.useRef<HTMLDivElement>(null);
  const keyboardShortcutsModal = useKeyboardShortcutsModal();
  const refresh = useRefresh();
  const productRelease = useProductRelease();

  useScrollToTopOnNavigationChange({ outletDiv });
  Billing.useBillingUpdatedSignal(refresh);

  return (
    <div className="flex flex-col h-screen">
      <SiteMessageBanner />
      <ProductReleaseAnnouncementBanner productRelease={productRelease} />
      <Navigation onOpenKeyboardShortcuts={keyboardShortcutsModal.open} productRelease={productRelease} />
      <SupportSessionBanner />

      <BillingDangerBanner />

      <div className="relative flex-1 min-h-0 overflow-y-auto" ref={outletDiv}>
        <Outlet />
      </div>

      <DevBar />
      <KeyboardShortcutsModal isOpen={keyboardShortcutsModal.isOpen} onClose={keyboardShortcutsModal.close} />
    </div>
  );
}

function Navigation({
  onOpenKeyboardShortcuts,
  productRelease,
}: {
  onOpenKeyboardShortcuts: () => void;
  productRelease: ReturnType<typeof useProductRelease>;
}) {
  const { company, canAddGoal, canAddProject } = useCompanyLoaderData();
  const me = useMe()!;
  const paths = usePaths();
  const navigate = useNavigate();
  const unreadNotificationCount = Notifications.useUnreadCount();
  const [reviewCount, refetchReviewCount] = useAssignmentsCount();
  useReviewRefreshSignal(refetchReviewCount);
  const search = useGlobalSearchHandler();
  const fullTextSearchPath = companySearchPathBuilder(paths);

  const handleLogOut = async () => {
    const res = await logOut();

    if (res === "success") {
      window.location.href = "/";
    }
  };

  const props: CompanyNavigation.Props = {
    companyName: company.name,
    me: {
      id: me.id,
      fullName: me.fullName,
      email: me.email,
      avatarUrl: me.avatarUrl,
    },
    links: {
      home: paths.homePath(),
      workMap: paths.workMapPath(),
      profile: paths.profilePath(me.id),
      review: paths.reviewPath(),
      people: paths.peoplePath(),
      orgChart: paths.orgChartPath(),
      notifications: paths.notificationsPath(),
      account: paths.accountPath(),
      companyAdmin: paths.companyAdminPath(),
      lobby: Paths.lobbyPath(),
      newGoal: paths.newGoalPath(),
      newProject: paths.newProjectPath(),
      newSpace: paths.newSpacePath(),
      invitePeople: paths.invitePeoplePath(),
      profileEdit: paths.profileEditPath(me.id),
      accountSettings: paths.accountSettingsPath(),
      accountSecurity: paths.accountSecurityPath(),
      accountApiTokens: paths.accountApiTokensPath(),
      accountMcpConnections: paths.accountMcpConnectionsPath(),
    },
    canViewCompanyDirectory: company.permissions?.canView || false,
    canAddGoal,
    canAddProject,
    canAddSpace: company.permissions?.canCreateSpace || false,
    canInvitePeople: company.permissions?.canInviteMembers || false,
    unreadNotificationCount,
    reviewCount,
    discordUrl: window.appConfig.discordUrl,
    contactUsHref: contactUsLink(company.name, company.id),
    onOpenKeyboardShortcuts,
    onLogOut: handleLogOut,
    search,
    onNavigate: navigate,
    fullTextSearchPath,
    showCurrentVersion: window.appConfig.updateBadgeEnabled !== false,
    availableUpdate: toAvailableUpdate(productRelease, window.appConfig.releaseVersion),
  };

  return <CompanyNavigation {...props} />;
}

function contactUsLink(companyName: string, companyId: string) {
  const params = encodeUrlParams({
    body: "\n\norg name: " + companyName + "\norg id: " + companyId + "\n\n",
  });

  return `mailto:support@operately.com` + params;
}
