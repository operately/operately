import { Decorator, StoryContext } from "@storybook/react-vite";
import React from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

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

  //
  // Storybooks use iframes to display stories, so any navigation
  // will not change the page URL, only the iframe URL.
  //
  // In some cases, we want to update the parent history, for example,
  // if we want to navigate to a different story (goal page -> goal close page).
  //
  // Here is the logic to handle that:
  // - If the new path starts with "/?path=/story/", we update the parent history. We are navigating to a different story.
  // - If the new path does not start with "/?path=/story/", we do not update the parent history. We are navigating to a different path within the same story.

  React.useEffect(() => {
    const newPath = location.pathname + location.search;

    if (!initialPath || initialPath === newPath) {
      return;
    }

    if (isStoryPath(newPath)) {
      changeTheGlobalLocation(newPath);
    }
  }, [location.pathname, location.search]);

  return children;
}

function isStoryPath(path: string): boolean {
  return path.startsWith("/?path=/story/");
}

function changeTheGlobalLocation(newPath: string): void {
  window.parent.history.pushState({}, "", newPath);

  window.parent.dispatchEvent(
    new PopStateEvent("popstate", {
      state: {},
    }),
  );
}
