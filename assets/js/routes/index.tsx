import React from "react";

import DefaultLayout from "@/layouts/DefaultLayout";

import * as GroupPage from "@/pages/GroupPage";
import * as GroupListPage from "@/pages/GroupListPage";
import * as GroupAddPage from "@/pages/GroupAddPage";
import * as GroupMembersPage from "@/pages/GroupMembersPage";

import { HomePage } from "@/pages/HomePage";
import { MyAssignmentsPage } from "@/pages/MyAssignmentsPage";

import { AccountPage } from "@/pages/AccountPage";
import { AccountEditProfilePage } from "@/pages/AccountEditProfilePage";
import { AccountNotificationSettingsPage } from "@/pages/AccountNotificationSettingsPage";

import * as ProjectPage from "@/pages/ProjectPage";
import * as ProjectListPage from "@/pages/ProjectListPage";
import * as ProjectMilestonesPage from "@/pages/ProjectMilestonesPage";
import * as ProjectMilestonePage from "@/pages/ProjectMilestonePage";
import * as ProjectStatusUpdateNewPage from "@/pages/ProjectStatusUpdateNewPage";
import * as ProjectStatusUpdatePage from "@/pages/ProjectStatusUpdatePage";
import * as ProjectAddPage from "../pages/ProjectAddPage";
import { ProjectContributorsPage } from "@/pages/ProjectContributorsPage";
import { ProjectDocumentationPage } from "@/pages/ProjectDocumentationPage";

import { TenetListPage, TenetListPageLoader } from "../pages/TenetListPage";

import { KpiPage, KpiPageLoader } from "../pages/KpiPage";
import { KpiListPage, KpiListPageLoader } from "../pages/KpiListPage";

import { ObjectivePage } from "../pages/ObjectivePage";
import { ObjectiveListPage, ObjectiveListPageLoader } from "../pages/ObjectiveListPage";

import ProfilePage from "../pages/ProfilePage";

import NotFoundPage from "../pages/NotFoundPage";
import { CompanyPage } from "../pages/Company";

import { createBrowserRouter } from "react-router-dom";
import { loaderWithApollo, pageRoute } from "./utils";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/account",
        element: <AccountPage />,
      },
      {
        path: "/account/profile",
        element: <AccountEditProfilePage />,
      },
      {
        path: "/account/notifications",
        element: <AccountNotificationSettingsPage />,
      },
      {
        path: "/home/my-assignments",
        element: <MyAssignmentsPage />,
      },
      pageRoute("/groups", GroupListPage),
      pageRoute("/groups/new", GroupAddPage),
      pageRoute("/groups/:id", GroupPage),
      pageRoute("/groups/:id/members", GroupMembersPage),
      pageRoute("/projects", ProjectListPage),
      pageRoute("/projects/new", ProjectAddPage),
      pageRoute("/projects/:project_id/updates/new", ProjectStatusUpdateNewPage),
      pageRoute("/projects/:project_id/milestones", ProjectMilestonesPage),
      pageRoute("/projects/:project_id/milestones/:id", ProjectMilestonePage),
      {
        path: "/projects/:project_id/contributors",
        element: <ProjectContributorsPage />,
      },
      {
        path: "/projects/:project_id/documentation/*",
        element: <ProjectDocumentationPage />,
      },
      pageRoute("/projects/:id/*", ProjectPage),
      {
        path: "/tenets",
        loader: loaderWithApollo(TenetListPageLoader),
        element: <TenetListPage />,
      },
      {
        path: "/tenets/:id",
        element: <ObjectiveListPage />,
      },
      {
        path: "/kpis",
        loader: loaderWithApollo(KpiListPageLoader),
        element: <KpiListPage />,
      },
      {
        path: "/kpis/:id",
        loader: loaderWithApollo(KpiPageLoader),
        element: <KpiPage />,
      },
      {
        path: "/objectives",
        loader: loaderWithApollo(ObjectiveListPageLoader),
        element: <ObjectiveListPage />,
      },
      {
        path: "/objectives/:id",
        element: <ObjectivePage />,
      },
      {
        path: "/people/:id",
        element: <ProfilePage />,
      },
      {
        path: "/company",
        element: <CompanyPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default routes;
