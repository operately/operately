import React from 'react';

import GroupPage from '../pages/GroupPage';
import GroupsPage from '../pages/GroupsPage';
import NotFoundPage from '../pages/NotFoundPage';

import { Route } from "react-router-dom";

const routes = (
  <Route path="/">
    <Route>
      <Route path="groups" element={<GroupsPage />} />
      <Route path="groups/:groupId" element={<GroupPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Route>
);

export default routes;
