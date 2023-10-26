import React from "react";

import pages from "@/pages";

import { createBrowserRouter } from "react-router-dom";
import { pageRoute } from "./utils";

import DefaultLayout from "@/layouts/DefaultLayout";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      pageRoute("/", pages.HomePage),
      pageRoute("/home/my-assignments", pages.MyAssignmentsPage),

      pageRoute("/account", pages.AccountPage),
      pageRoute("/account/profile", pages.AccountEditProfilePage),
      pageRoute("/account/notifications", pages.AccountNotificationSettingsPage),
      pageRoute("/notifications", pages.NotificationsPage),

      pageRoute("/groups", pages.GroupListPage),
      pageRoute("/groups/new", pages.GroupAddPage),
      pageRoute("/groups/:id", pages.GroupPage),
      pageRoute("/groups/:id/members", pages.GroupMembersPage),

      pageRoute("/projects", pages.ProjectListPage),
      pageRoute("/projects/new", pages.ProjectAddPage),
      pageRoute("/projects/:projectID/updates/new", pages.ProjectStatusUpdateNewPage),
      pageRoute("/projects/:projectID/milestones", pages.ProjectMilestonesPage),
      pageRoute("/projects/:projectID/milestones/:id", pages.ProjectMilestonePage),
      pageRoute("/projects/:projectID/reviews/request/new", pages.ProjectReviewRequestNewPage),
      pageRoute("/projects/:projectID/reviews/request/:id", pages.ProjectReviewRequestPage),
      pageRoute("/projects/:projectID/reviews/request/:id/submit", pages.ProjectReviewRequestSubmitPage),
      pageRoute("/projects/:projectID/reviews/:id", pages.ProjectReviewPage),
      pageRoute("/projects/:projectID/phase_change/:newPhase", pages.ProjectPhaseChangeSurveyPage),
      pageRoute("/projects/:projectID/status_updates/:id", pages.ProjectStatusUpdatePage),
      pageRoute("/projects/:projectID/edit/name", pages.ProjectEditProjectNamePage),
      pageRoute("/projects/:projectID/edit/timeline", pages.ProjectEditTimelinePage),
      pageRoute("/projects/:projectID/contributors", pages.ProjectContributorsPage),
      pageRoute("/projects/:projectID/discussions/new", pages.ProjectDiscussionNewPage),
      pageRoute("/projects/:projectID/discussions/:id", pages.ProjectDiscussionPage),
      pageRoute("/projects/:id/dashboard", pages.ProjectDashboardPage),
      pageRoute("/projects/:id", pages.ProjectPage),
      pageRoute("*", pages.NotFoundPage),
    ],
  },
]);

export default routes;
