import React from "react";
import ErrorPage from "./ErrorPage";
import DefaultLayout from "@/layouts/DefaultLayout";

import pages from "@/pages";

import { Outlet, createBrowserRouter } from "react-router-dom";
import { companyLoader } from "./companyLoader";
import { pageRoute } from "./pageRoute";

import { CurrentUserProvider } from "@/contexts/CurrentUserContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

function ProtectedRoutes() {
  return (
    <CurrentUserProvider>
      <ThemeProvider>
        <TimezoneProvider>
          <DefaultLayout />
        </TimezoneProvider>
      </ThemeProvider>
    </CurrentUserProvider>
  );
}

function PublicRoutes() {
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}

export function createAppRoutes() {
  return createBrowserRouter([
    pageRoute("/", pages.LobbyPage),
    pageRoute("/new", pages.NewCompanyPage),
    pageRoute("/setup", pages.SetupPage),
    pageRoute("/join", pages.JoinPage),
    {
      path: "/",
      element: <PublicRoutes />,
      errorElement: <ErrorPage />,
      children: [pageRoute("/__design__", pages.DesignPage)],
    },
    {
      path: "/:companyId",
      loader: companyLoader,
      element: <ProtectedRoutes />,
      errorElement: <ErrorPage />,
      children: [
        pageRoute("", pages.SpaceListPage),
        pageRoute("feed", pages.FeedPage),
        pageRoute("review", pages.ReviewPage),
        pageRoute("notifications", pages.NotificationsPage),

        pageRoute("admin", pages.CompanyAdminPage),
        pageRoute("admin/manage-admins", pages.CompanyAdminManageAdminsPage),
        pageRoute("admin/manage-people", pages.CompanyAdminManagePeoplePage),
        pageRoute("admin/manage-people/add", pages.CompanyAdminAddPeoplePage),
        pageRoute("admin/manage-trusted-email-domains", pages.CompanyAdminTrustedEmailDomainsPage),

        pageRoute("account", pages.AccountPage),
        pageRoute("account/appearance", pages.AccountAppearancePage),

        pageRoute("people", pages.PeoplePage),
        pageRoute("people/org-chart", pages.PeopleOrgChartPage),
        pageRoute("people/:id", pages.ProfilePage),
        pageRoute("people/:id/goals", pages.ProfileGoalsPage),
        pageRoute("people/:id/profile/edit", pages.ProfileEditPage),

        pageRoute("spaces/new", pages.SpaceAddPage),
        pageRoute("spaces/:id", pages.SpacePage),
        pageRoute("spaces/:id/edit", pages.SpaceEditPage),
        pageRoute("spaces/:id/appearance", pages.SpaceAppearancePage),
        pageRoute("spaces/:id/projects/new", pages.ProjectAddPage),
        pageRoute("spaces/:id/projects", pages.SpaceProjectsPage),
        pageRoute("spaces/:id/discussions", pages.SpaceDiscussionsPage),
        pageRoute("spaces/:id/discussions/new", pages.DiscussionNewPage),
        pageRoute("spaces/:id/goals/new", pages.GoalAddPage),
        pageRoute("spaces/:id/goals", pages.SpaceGoalsPage),
        pageRoute("spaces/:id/access", pages.SpaceAccessManagementPage),
        pageRoute("spaces/:id/edit/general-access", pages.SpaceEditGeneralAccessPage),
        pageRoute("spaces/:id/add-members", pages.SpaceAddMembersPage),

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
        pageRoute("goals/:goalId/discussions", pages.GoalDiscussionsPage),
        pageRoute("goals/:goalId/discussions/new", pages.GoalDiscussionNewPage),

        pageRoute("goal-updates/:id", pages.GoalProgressUpdatePage),
        pageRoute("goal-updates/:id/edit", pages.GoalProgressUpdateEditPage),
        pageRoute("goal-activities/:id", pages.GoalActivityPage),
        pageRoute("goal-activities/:id/edit", pages.GoalDiscussionEditPage),

        pageRoute("projects", pages.ProjectsPage),
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
        pageRoute("projects/:id", pages.ProjectPage),

        pageRoute("project-check-ins/:id", pages.ProjectCheckInPage),
        pageRoute("project-check-ins/:id/edit", pages.ProjectCheckInEditPage),
        pageRoute("project-resources/:id/edit", pages.ProjectEditResourcePage),
        pageRoute("project-contribs/:id/edit", pages.ProjectContributorsEditPage),

        pageRoute("milestones/:id", pages.ProjectMilestonePage),

        pageRoute("*", pages.NotFoundPage),
      ],
    },
  ]);
}
