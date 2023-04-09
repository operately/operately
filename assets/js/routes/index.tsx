import React from 'react';

import DefaultLayout from '../layouts/DefaultLayout';

import {GroupPage, GroupPageLoader} from '../pages/GroupPage';
import {GroupListPage, GroupsListPageLoader} from '../pages/GroupListPage';
import GroupAddPage from '../pages/GroupAddPage';
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
        path: "*",
        element: <NotFoundPage />,
      }
    ]
  }
]);

export default routes;
