import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Decorator, StoryContext } from '@storybook/react';

interface RouterDecoratorParams {
  path?: string;
  routePath?: string;
}

export const RouterDecorator: Decorator = (Story, context: StoryContext) => {
  const params = context.parameters.reactRouter as RouterDecoratorParams || {};
  const { path = '/', routePath = '/' } = params;
  
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={<Story />} />
      </Routes>
    </MemoryRouter>
  );
};
