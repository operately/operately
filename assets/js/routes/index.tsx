import React from 'react';

import DefaultLayout from '../layouts/DefaultLayout';

import GroupPage from '../pages/GroupPage';
import GroupListPage from '../pages/GroupListPage';
import NotFoundPage from '../pages/NotFoundPage';

import { Route } from "react-router-dom";

const routes = (
  <Route path="/" element={<DefaultLayout />}>
    <Route>
      <Route path="groups" element={<GroupListPage />} />
      <Route path="groups/:id" element={<GroupPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Route>
);

export default routes;
