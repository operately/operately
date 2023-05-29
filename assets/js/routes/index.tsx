import React from "react";

import DefaultLayout from "../layouts/DefaultLayout";

import GroupAddPage from "../pages/GroupAddPage";
import { GroupPage, GroupPageLoader } from "../pages/GroupPage";
import { GroupListPage, GroupsListPageLoader } from "../pages/GroupListPage";

import ProjectAddPage from "../pages/ProjectAddPage";
import { ProjectPage } from "../pages/ProjectPage";
import {
  ProjectListPage,
  ProjectListPageLoader,
} from "../pages/ProjectListPage";

import TenetAddPage from "../pages/TenetAddPage";
import { TenetPage, TenetPageLoader } from "../pages/TenetPage";
import { TenetListPage, TenetListPageLoader } from "../pages/TenetListPage";

import KpiAddPage from "../pages/KpiAddPage";
import { KpiPage, KpiPageLoader } from "../pages/KpiPage";
import { KpiListPage, KpiListPageLoader } from "../pages/KpiListPage";

import ObjectiveAddPage from "../pages/ObjectiveAddPage";
import { ObjectivePage, ObjectivePageLoader } from "../pages/ObjectivePage";
import {
  ObjectiveListPage,
  ObjectiveListPageLoader,
} from "../pages/ObjectiveListPage";

import ProfilePage from "../pages/ProfilePage";

import NotFoundPage from "../pages/NotFoundPage";
import { CompanyPage } from "../pages/Company";

import { createBrowserRouter } from "react-router-dom";
import client from "../graphql/client";
import nprogress from "nprogress";

function loaderWithApollo(loader: any) {
  return async (params: any) => {
    try {
      nprogress.start();

      const data = await loader(client, params);

      nprogress.done();

      return data;
    } catch (error) {
      console.error(error);
      nprogress.done();
    }
  };
}

const routes = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      {
        path: "/groups",
        loader: loaderWithApollo(GroupsListPageLoader),
        element: <GroupListPage />,
      },
      {
        path: "/groups/new",
        element: <GroupAddPage />,
      },
      {
        path: "/groups/:id",
        loader: loaderWithApollo(GroupPageLoader),
        element: <GroupPage />,
      },
      {
        path: "/projects",
        loader: loaderWithApollo(ProjectListPageLoader),
        element: <ProjectListPage />,
      },
      {
        path: "/projects/new",
        element: <ProjectAddPage />,
      },
      {
        path: "/projects/:id/*",
        element: <ProjectPage />,
      },
      {
        path: "/tenets",
        loader: loaderWithApollo(TenetListPageLoader),
        element: <TenetListPage />,
      },
      {
        path: "/tenets/new",
        element: <TenetAddPage />,
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
        path: "/kpis/new",
        element: <KpiAddPage />,
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
        path: "/objectives/new",
        element: <ObjectiveAddPage />,
      },
      {
        path: "/objectives/:id",
        loader: loaderWithApollo(ObjectivePageLoader),
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
