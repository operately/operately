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
    {
      path: "/:companySlug",
      loader: companyLoader,
      element: <ProtectedRoutes />,
      errorElement: <ErrorPage />,
      children: [
        pageRoute("", pages.GroupListPage),
        pageRoute("feed", pages.FeedPage),

        pageRoute("company/admin", pages.CompanyAdminPage),
        pageRoute("company/admin/manageAdmins", pages.CompanyAdminManageAdminsPage),
        pageRoute("company/admin/managePeople", pages.CompanyAdminManagePeoplePage),
        pageRoute("company/admin/managePeople/addPeople", pages.CompanyAdminAddPeoplePage),
        pageRoute("company/admin/manageTrustedEmailDomains", pages.CompanyAdminTrustedEmailDomainsPage),

        pageRoute("account", pages.AccountPage),
        pageRoute("account/profile", pages.AccountEditProfilePage),
        pageRoute("account/appearance", pages.AccountAppearancePage),

        pageRoute("people/:id", pages.ProfilePage),
        pageRoute("people/:id/goals", pages.ProfileGoalsPage),
        pageRoute("notifications", pages.NotificationsPage),

        pageRoute("people", pages.PeoplePage),
        pageRoute("people/org-chart", pages.PeopleOrgChartPage),

        pageRoute("spaces/new", pages.GroupAddPage),
        pageRoute("spaces/:id", pages.GroupPage),
        pageRoute("spaces/:id/edit", pages.GroupEditPage),
        pageRoute("spaces/:id/members", pages.GroupMembersPage),
        pageRoute("spaces/:id/appearance", pages.GroupAppearancePage),
        pageRoute("spaces/:id/projects/new", pages.ProjectAddPage),
        pageRoute("spaces/:id/projects", pages.GroupProjectsPage),
        pageRoute("spaces/:id/goals/new", pages.GoalAddPage),
        pageRoute("spaces/:id/goals", pages.GroupGoalsPage),

        pageRoute("tasks/:id", pages.TaskPage),

        pageRoute("spaces/:id/discussions", pages.GroupDiscussionsPage),
        pageRoute("spaces/:spaceId/discussions/new", pages.DiscussionNewPage),
        pageRoute("spaces/:spaceId/discussions/:id", pages.DiscussionPage),
        pageRoute("spaces/:spaceId/discussions/:id/edit", pages.DiscussionEditPage),

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
        pageRoute("projects/:projectID/milestones/:id", pages.ProjectMilestonePage),
        pageRoute("projects/:projectID/check-ins", pages.ProjectCheckInsPage),
        pageRoute("projects/:projectID/check-ins/new", pages.ProjectCheckInNewPage),
        pageRoute("projects/:projectID/check-ins/:id", pages.ProjectCheckInPage),
        pageRoute("projects/:projectID/check-ins/:id/edit", pages.ProjectCheckInEditPage),
        pageRoute("projects/:projectID/edit/name", pages.ProjectEditProjectNamePage),
        pageRoute("projects/:projectID/edit/timeline", pages.ProjectEditTimelinePage),
        pageRoute("projects/:projectID/edit/description", pages.ProjectEditDescriptionPage),
        pageRoute("projects/:projectID/edit/resources", pages.ProjectEditResourcesPage),
        pageRoute("projects/:projectID/edit/goal", pages.ProjectEditGoalPage),
        pageRoute("projects/:projectID/resources/new", pages.ProjectAddResourcePage),
        pageRoute("projects/:projectID/resources/:id/edit", pages.ProjectEditResourcePage),
        pageRoute("projects/:projectID/contributors", pages.ProjectContributorsPage),
        pageRoute("projects/:id", pages.ProjectPage),

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
