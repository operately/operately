import React from "react";
import ErrorPage from "./ErrorPage";

import pages from "@/pages";

import { createBrowserRouter, ShouldRevalidateFunction } from "react-router-dom";
import { companyLoader } from "./companyLoader";
import { pageRoute } from "./pageRoute";

import { CurrentCompanyProvider } from "@/contexts/CurrentCompanyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";

import { saasAdminRoutes } from "@/ee/routes";
import CompanyLayout from "@/layouts/CompanyLayout";
import NonCompanyLayout from "@/layouts/NonCompanyLayout";

function NonCompanyRoutes() {
  return (
    <ThemeProvider>
      <NonCompanyLayout />
    </ThemeProvider>
  );
}

function CompanyRoutes() {
  return (
    <CurrentCompanyProvider>
      <ThemeProvider>
        <TimezoneProvider>
          <CompanyLayout />
        </TimezoneProvider>
      </ThemeProvider>
    </CurrentCompanyProvider>
  );
}

export function createAppRoutes() {
  return createBrowserRouter([
    {
      path: "/",
      element: <NonCompanyRoutes />,
      errorElement: <ErrorPage />,
      children: [
        pageRoute("/log_in", pages.LoginPage, { auth: false }),
        pageRoute("/sign_up", pages.SignUpPage, { auth: false }),
        pageRoute("/sign_up/email", pages.SignUpWithEmailPage, { auth: false }),
        pageRoute("/forgot-password", pages.ForgotPasswordPage, { auth: false }),
        pageRoute("/reset-password", pages.ResetPasswordPage, { auth: false }),

        pageRoute("", pages.LobbyPage),
        pageRoute("/new", pages.NewCompanyPage),
        pageRoute("/setup", pages.SetupPage, { auth: false }),
        pageRoute("/join", pages.JoinPage, { auth: false }),
      ],
    },
    saasAdminRoutes(),
    {
      id: "companyRoot",
      path: "/:companyId",
      loader: companyLoader,
      element: <CompanyRoutes />,
      errorElement: <ErrorPage />,
      shouldRevalidate: companyShouldRevalidate,
      children: [
        pageRoute("", pages.HomePage),
        pageRoute("feed", pages.FeedPage),
        pageRoute("review", pages.ReviewPage),
        pageRoute("notifications", pages.NotificationsPage),
        pageRoute("ai", pages.AiPlaygroundPage),

        pageRoute("admin", pages.CompanyAdminPage),
        pageRoute("admin/manage-admins", pages.CompanyAdminManageAdminsPage),
        pageRoute("admin/manage-people", pages.CompanyAdminManagePeoplePage),
        pageRoute("admin/manage-people/add", pages.CompanyAdminAddPeoplePage),
        pageRoute("admin/manage-ai-agents", pages.CompanyManageAiAgentsPage),
        pageRoute("admin/manage-ai-agents/:id", pages.AgentPage),
        pageRoute("admin/manage-trusted-email-domains", pages.CompanyAdminTrustedEmailDomainsPage),
        pageRoute("admin/restore-suspended-people", pages.CompanyAdminRestoreSuspendedPeoplePage),
        pageRoute("admin/permissions", pages.CompanyPermissionsPage),
        pageRoute("admin/rename", pages.CompanyRenamePage),

        pageRoute("account", pages.AccountPage),
        pageRoute("account/appearance", pages.AccountAppearancePage),
        pageRoute("account/security", pages.AccountSecurityPage),
        pageRoute("account/security/change-password", pages.AccountChangePasswordPage),

        pageRoute("people", pages.PeoplePage),
        pageRoute("people/org-chart", pages.PeopleOrgChartPage),
        pageRoute("people/:id", pages.ProfilePage),
        pageRoute("people/:id/profile/edit", pages.ProfileEditPage),

        pageRoute("spaces/new", pages.SpaceAddPage),
        pageRoute("spaces/:id", pages.SpacePage),
        pageRoute("spaces/:id/edit", pages.SpaceEditPage),
        pageRoute("spaces/:id/projects/new", pages.ProjectAddPage),
        pageRoute("spaces/:id/discussions", pages.SpaceDiscussionsPage),
        pageRoute("spaces/:id/discussions/new", pages.DiscussionNewPage),
        pageRoute("spaces/:id/discussions/drafts", pages.DiscussionDraftsPage),
        pageRoute("spaces/:id/goals/new", pages.GoalAddPage),
        pageRoute("spaces/:id/access", pages.SpaceAccessManagementPage),
        pageRoute("spaces/:id/edit/general-access", pages.SpaceEditGeneralAccessPage),
        pageRoute("spaces/:id/add-members", pages.SpaceAddMembersPage),
        pageRoute("spaces/:id/work-map", pages.SpaceWorkMapPage),

        pageRoute("resource-hubs/:id", pages.ResourceHubPage),
        pageRoute("resource-hubs/:id/drafts", pages.ResourceHubDraftsPage),
        pageRoute("resource-hubs/:id/new-document", pages.ResourceHubNewDocumentPage),
        pageRoute("resource-hubs/:id/new-link", pages.ResourceHubNewLinkPage),
        pageRoute("folders/:id", pages.ResourceHubFolderPage),
        pageRoute("documents/:id", pages.ResourceHubDocumentPage),
        pageRoute("documents/:id/edit", pages.ResourceHubEditDocumentPage),
        pageRoute("files/:id", pages.ResourceHubFilePage),
        pageRoute("files/:id/edit", pages.ResourceHubEditFilePage),
        pageRoute("links/:id", pages.ResourceHubLinkPage),
        pageRoute("links/:id/edit", pages.ResourceHubEditLinkPage),

        pageRoute("tasks/:id", pages.TaskPage),

        pageRoute("discussions/:id", pages.DiscussionPage),
        pageRoute("discussions/:id/edit", pages.DiscussionEditPage),

        pageRoute("work-map", pages.CompanyWorkMapPage),

        pageRoute("goals/new", pages.GoalAddPage),
        pageRoute("goals/:id", pages.GoalPage),
        pageRoute("goals/:id/md", pages.GoalAsMarkdownPage),
        pageRoute("goals/:goalId/complete", pages.GoalClosingPage),
        pageRoute("goals/:goalId/reopen", pages.GoalReopenPage),
        pageRoute("goals/:goalId/progress-updates/new", pages.GoalCheckInNewPage),
        pageRoute("goals/:goalId/check-ins/new", pages.GoalCheckInNewPage),
        pageRoute("goals/:goalId/discussions/new", pages.GoalDiscussionNewPage),

        pageRoute("goal-check-ins/:id", pages.GoalCheckInPage),
        pageRoute("goal-updates/:id", pages.GoalCheckInPage),

        pageRoute("goal-activities/:id", pages.GoalActivityPage),
        pageRoute("goal-activities/:id/edit", pages.GoalDiscussionEditPage),

        pageRoute("projects/new", pages.ProjectAddPage),
        pageRoute("projects/:projectID/pause", pages.ProjectPausePage),
        pageRoute("projects/:projectID/resume", pages.ProjectResumePage),
        pageRoute("projects/:projectID/move", pages.ProjectMovePage),
        pageRoute("projects/:projectID/close", pages.ProjectClosePage),
        pageRoute("projects/:projectID/milestones", pages.ProjectMilestonesPage),
        pageRoute("projects/:projectID/retrospective", pages.ProjectRetrospectivePage),
        pageRoute("projects/:projectID/retrospective/edit", pages.ProjectRetrospectiveEditPage),
        pageRoute("projects/:projectID/check-ins", pages.ProjectCheckInsPage),
        pageRoute("projects/:projectID/check-ins/new", pages.ProjectCheckInNewPage),
        pageRoute("projects/:projectID/edit/name", pages.ProjectEditProjectNamePage),
        pageRoute("projects/:projectID/edit/permissions", pages.ProjectEditAccessLevelsPage),
        pageRoute("projects/:projectID/edit/timeline", pages.ProjectEditTimelinePage),
        pageRoute("projects/:projectID/edit/description", pages.ProjectEditDescriptionPage),
        pageRoute("projects/:projectID/edit/resources", pages.ProjectEditResourcesPage),
        pageRoute("projects/:projectID/edit/goal", pages.ProjectEditGoalPage),
        pageRoute("projects/:projectID/resources/new", pages.ProjectAddResourcePage),
        pageRoute("projects/:projectID/contributors", pages.ProjectContributorsPage),
        pageRoute("projects/:projectID/contributors/add", pages.ProjectContributorsAddPage),
        pageRoute("projects/:projectID/discussions/new", pages.ProjectDiscussionNewPage),
        pageRoute("projects/:id", pages.ProjectPage),
        pageRoute("projects/:id/v2", pages.ProjectV2Page),
        pageRoute("projects/:id/md", pages.ProjectAsMarkdownPage),

        pageRoute("project-check-ins/:id", pages.ProjectCheckInPage),
        pageRoute("project-check-ins/:id/edit", pages.ProjectCheckInEditPage),
        pageRoute("project-resources/:id/edit", pages.ProjectEditResourcePage),
        pageRoute("project-contribs/:id/edit", pages.ProjectContributorsEditPage),
        pageRoute("project-discussions/:id", pages.ProjectDiscussionPage),
        pageRoute("project-discussions/:id/edit", pages.ProjectDiscussionEditPage),

        pageRoute("milestones/:id", pages.ProjectMilestonePage),

        pageRoute("*", pages.NotFoundPage),
      ],
    },
  ]);
}

/**
 * Prevents the company loader from rerunning when only the search parameters change.
 * This applies to all routes that use CompanyLayout.
 */
const companyShouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, defaultShouldRevalidate }) => {
  // If only search params changed but pathname is the same, don't revalidate
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search) {
    return false;
  }

  return defaultShouldRevalidate;
};
