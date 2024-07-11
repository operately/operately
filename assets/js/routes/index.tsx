import React from "react";
import pages from "@/pages";

import { Outlet, createBrowserRouter } from "react-router-dom";
import { pageRoute } from "./pageRoute";

import { companyLoader } from "./companyLoader";
import ErrorPage from "./ErrorPage";
import DefaultLayout from "@/layouts/DefaultLayout";

import { CurrentUserProvider } from "@/contexts/CurrentUserContext";

function ProtectedRoutes() {
  return (
    <CurrentUserProvider>
      <DefaultLayout />
    </CurrentUserProvider>
  );
}

function PublicRoutes() {
  return <Outlet />;
}

export function createAppRoutes() {
  return createBrowserRouter([
    pageRoute("/", pages.LobbyPage),
    {
      path: "/:companyId",
      loader: companyLoader,
      element: <ProtectedRoutes />,
      errorElement: <ErrorPage />,
      children: [
        pageRoute("", pages.SpaceListPage),
        pageRoute("feed", pages.FeedPage),

        pageRoute("admin", pages.CompanyAdminPage),
        pageRoute("admin/manage-admins", pages.CompanyAdminManageAdminsPage),
        pageRoute("admin/manage-people", pages.CompanyAdminManagePeoplePage),
        pageRoute("admin/manage-people/add", pages.CompanyAdminAddPeoplePage),
        pageRoute("admin/manage-trusted-email-domains", pages.CompanyAdminTrustedEmailDomainsPage),

        pageRoute("account", pages.AccountPage),
        pageRoute("account/profile", pages.AccountEditProfilePage),
        pageRoute("account/appearance", pages.AccountAppearancePage),

        pageRoute("people/:id", pages.ProfilePage),
        pageRoute("people/:id/goals", pages.ProfileGoalsPage),
        pageRoute("notifications", pages.NotificationsPage),

        pageRoute("people", pages.PeoplePage),
        pageRoute("people/org-chart", pages.PeopleOrgChartPage),

        pageRoute("spaces/new", pages.SpaceAddPage),
        pageRoute("spaces/:id", pages.SpacePage),
        pageRoute("spaces/:id/edit", pages.SpaceEditPage),
        pageRoute("spaces/:id/edit/permissions", pages.SpaceEditPermissionsPage),
        pageRoute("spaces/:id/members", pages.GroupMembersPage),
        pageRoute("spaces/:id/appearance", pages.GroupAppearancePage),
        pageRoute("spaces/:id/projects/new", pages.ProjectAddPage),
        pageRoute("spaces/:id/projects", pages.SpaceProjectsPage),
        pageRoute("spaces/:id/discussions", pages.SpaceDiscussionsPage),
        pageRoute("spaces/:id/discussions/new", pages.DiscussionNewPage),
        pageRoute("spaces/:id/goals/new", pages.GoalAddPage),
        pageRoute("spaces/:id/goals", pages.SpaceGoalsPage),

        pageRoute("tasks/:id", pages.TaskPage),

        pageRoute("discussions/:id", pages.DiscussionPage),
        pageRoute("discussions/:id/edit", pages.DiscussionEditPage),

        pageRoute("goals", pages.GoalsPage),
        pageRoute("goals/new", pages.GoalAddPage),
        pageRoute("goals/:id", pages.GoalPage),
        pageRoute("goals/:id/subgoals", pages.GoalSubgoalsPage),
        pageRoute("goals/:id/about", pages.GoalAboutPage),
        pageRoute("goals/:goalId/edit", pages.GoalEditPage),
        pageRoute("goals/:goalId/edit/parent", pages.GoalEditParentPage),
        pageRoute("goals/:goalId/edit/timeframe", pages.GoalEditTimeframePage),
        pageRoute("goals/:goalId/complete", pages.GoalClosingPage),
        pageRoute("goals/:goalId/reopen", pages.GoalReopenPage),
        pageRoute("goals/:goalId/archive", pages.GoalArchivePage),
        pageRoute("goals/:goalId/progress-updates/new", pages.GoalProgressUpdateNewPage),
        pageRoute("goals/:goalId/progress-updates/:id", pages.GoalProgressUpdatePage),
        pageRoute("goals/:goalId/progress-updates/:id/edit", pages.GoalProgressUpdateEditPage),
        pageRoute("goals/:goalId/discussions", pages.GoalDiscussionsPage),
        pageRoute("goals/:goalId/discussions/new", pages.GoalDiscussionNewPage),
        pageRoute("goals/:goalId/discussions/:id/edit", pages.GoalDiscussionEditPage),
        pageRoute("goals/:goalId/activities/:id", pages.GoalActivityPage),

        pageRoute("projects", pages.ProjectsPage),
        pageRoute("projects/new", pages.ProjectAddPage),
        pageRoute("projects/:projectID/pause", pages.ProjectPausePage),
        pageRoute("projects/:projectID/resume", pages.ProjectResumePage),
        pageRoute("projects/:projectID/move", pages.ProjectMovePage),
        pageRoute("projects/:projectID/close", pages.ProjectClosePage),
        pageRoute("projects/:projectID/milestones", pages.ProjectMilestonesPage),
        pageRoute("projects/:projectID/retrospective", pages.ProjectRetrospectivePage),
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
        pageRoute("projects/:id", pages.ProjectPage),

        pageRoute("project-check-ins/:id", pages.ProjectCheckInPage),
        pageRoute("project-check-ins/:id/edit", pages.ProjectCheckInEditPage),
        pageRoute("project-resources/:id/edit", pages.ProjectEditResourcePage),

        pageRoute("milestones/:id", pages.ProjectMilestonePage),

        pageRoute("*", pages.NotFoundPage),
      ],
    },
    {
      path: "/",
      element: <PublicRoutes />,
      errorElement: <ErrorPage />,
      children: [
        pageRoute("/first-time-setup", pages.FirstTimeSetupPage),
        pageRoute("/first-time-login", pages.FirstTimeLoginPage),
      ],
    },
  ]);
}
