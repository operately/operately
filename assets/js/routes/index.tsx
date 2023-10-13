import React from "react";

import DefaultLayout from "@/layouts/DefaultLayout";

import * as GroupPage from "@/pages/GroupPage";
import * as GroupListPage from "@/pages/GroupListPage";
import * as GroupAddPage from "@/pages/GroupAddPage";
import * as GroupMembersPage from "@/pages/GroupMembersPage";

import * as HomePage from "@/pages/HomePage";
import * as MyAssignmentsPage from "@/pages/MyAssignmentsPage";

import * as AccountPage from "@/pages/AccountPage";
import * as AccountEditProfilePage from "@/pages/AccountEditProfilePage";
import * as AccountNotificationSettingsPage from "@/pages/AccountNotificationSettingsPage";

import * as ProjectPage from "@/pages/ProjectPage";
import * as ProjectListPage from "@/pages/ProjectListPage";
import * as ProjectMilestonesPage from "@/pages/ProjectMilestonesPage";
import * as ProjectMilestonePage from "@/pages/ProjectMilestonePage";
import * as ProjectStatusUpdateNewPage from "@/pages/ProjectStatusUpdateNewPage";
import * as ProjectReviewPage from "@/pages/ProjectReviewPage";
import * as ProjectReviewRequestNewPage from "@/pages/ProjectReviewRequestNewPage";
import * as ProjectReviewRequestPage from "@/pages/ProjectReviewRequestPage";
import * as ProjectPhaseChangeSurveyPage from "@/pages/ProjectPhaseChangeSurveyPage";
import * as ProjectReviewRequestSubmitPage from "@/pages/ProjectReviewRequestSubmitPage";
import * as ProjectStatusUpdatePage from "@/pages/ProjectStatusUpdatePage";
import * as ProjectAddPage from "@/pages/ProjectAddPage";
import * as ProjectEditProjectNamePage from "@/pages/ProjectEditProjectNamePage";
import * as ProjectEditTimelinePage from "@/pages/ProjectEditTimelinePage";
import * as ProjectContributorsPage from "@/pages/ProjectContributorsPage";

import * as NotFoundPage from "@/pages/NotFoundPage";

import { createBrowserRouter } from "react-router-dom";
import { pageRoute } from "./utils";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      pageRoute("/", HomePage),
      pageRoute("/home/my-assignments", MyAssignmentsPage),

      pageRoute("/account", AccountPage),
      pageRoute("/account/profile", AccountEditProfilePage),
      pageRoute("/account/notifications", AccountNotificationSettingsPage),

      pageRoute("/groups", GroupListPage),
      pageRoute("/groups/new", GroupAddPage),
      pageRoute("/groups/:id", GroupPage),
      pageRoute("/groups/:id/members", GroupMembersPage),

      pageRoute("/projects", ProjectListPage),
      pageRoute("/projects/new", ProjectAddPage),
      pageRoute("/projects/:projectID/updates/new", ProjectStatusUpdateNewPage),
      pageRoute("/projects/:projectID/milestones", ProjectMilestonesPage),
      pageRoute("/projects/:projectID/milestones/:id", ProjectMilestonePage),
      pageRoute("/projects/:projectID/reviews/request/new", ProjectReviewRequestNewPage),
      pageRoute("/projects/:projectID/reviews/request/:id", ProjectReviewRequestPage),
      pageRoute("/projects/:projectID/reviews/request/:id/submit", ProjectReviewRequestSubmitPage),
      pageRoute("/projects/:projectID/reviews/:id", ProjectReviewPage),
      pageRoute("/projects/:projectID/phase_change/:newPhase", ProjectPhaseChangeSurveyPage),
      pageRoute("/projects/:projectID/status_updates/:id", ProjectStatusUpdatePage),
      pageRoute("/projects/:projectID/edit/name", ProjectEditProjectNamePage),
      pageRoute("/projects/:projectID/edit/timeline", ProjectEditTimelinePage),
      pageRoute("/projects/:projectID/contributors", ProjectContributorsPage),
      pageRoute("/projects/:id", ProjectPage),
      pageRoute("*", NotFoundPage),
    ],
  },
]);

export default routes;
