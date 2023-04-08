import React from 'react';

import DefaultLayout from '../layouts/DefaultLayout';

import {GroupPage, GroupPageLoader} from '../pages/GroupPage';
import GroupListPage from '../pages/GroupListPage';
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
        element: <GroupListPage />,
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
