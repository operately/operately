import React from "react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { Decorator, StoryContext } from "@storybook/react";

interface RouterDecoratorParams {
  path?: string;
  routePath?: string;
}

export const RouterDecorator: Decorator = (Story, context: StoryContext) => {
  const params = (context.parameters.reactRouter as RouterDecoratorParams) || {};
  const { path = "/", routePath = "/" } = params;

  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={routePath}
          element={
            <View>
              <Story />
            </View>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

function View({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [initialPath, setInitialPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    setInitialPath(location.pathname + location.search);
  }, []);

  React.useEffect(() => {
    const newPath = location.pathname + location.search;

    if (!initialPath || initialPath === newPath) {
      return;
    }

    window.parent.history.pushState({}, "", newPath);

    window.parent.dispatchEvent(
      new PopStateEvent("popstate", {
        state: {},
      }),
    );
  }, [location.pathname, location.search]);

  return children;
}
