import React from 'react';

import DefaultLayout from '../layouts/DefaultLayout';

import {GroupPage, GroupPageLoader} from '../pages/GroupPage';
import {ProjectPage, ProjectPageLoader} from '../pages/ProjectPage';

import {GroupListPage, GroupsListPageLoader} from '../pages/GroupListPage';
import {ProjectListPage, ProjectListPageLoader} from '../pages/ProjectListPage';

import GroupAddPage from '../pages/GroupAddPage';
import ProjectAddPage from '../pages/ProjectAddPage';
import NotFoundPage from '../pages/NotFoundPage';

import { createBrowserRouter } from "react-router-dom";
import client from '../graphql/client';
import nprogress from 'nprogress';

function loaderWithApollo(loader : any) {
  return async (params : any) => {
    nprogress.start();

    const data = await loader(client, params);

    nprogress.done();

    return data;
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
        path: "/projects/:id",
        loader: loaderWithApollo(ProjectPageLoader),
        element: <ProjectPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      }
    ]
  }
]);

export default routes;
