import React from "react";

interface RouteDefinition {
  path: string;
  element?: React.ReactNode;
  layout?: React.ComponentType<{ children: React.ReactNode }>;

  id?: string;
  loader?: (request: any) => Promise<any>;
  children?: RouteDefinition[];
  errorElement?: React.ReactNode;
}

export interface Route {
  id: string;
  element: React.ReactNode;
  path: string;
  pathRegex: RegExp;

  loader: ({ params, request }: { params: any; request: any }) => Promise<any>;
}

export function createRoutes(routes: RouteDefinition[]): Route[] {
  const flatRoutes: Route[] = [];

  function flattenRoutes(routes: RouteDefinition[], parents: RouteDefinition[] = []) {
    routes.forEach((route) => {
      if (route.children) {
        flattenRoutes(route.children, parents.concat(route));
      } else {
        flatRoutes.push(createRoute(route, parents));
      }
    });
  }

  flattenRoutes(routes);

  return flatRoutes;
}

function createRoute(route: RouteDefinition, parents: RouteDefinition[]): Route {
  const fullPath = parents.reduce((acc: string, parent: RouteDefinition) => acc + parent.path, "") + route.path;
  const allLoaders = parents.map((parent: RouteDefinition) => parent.loader).filter(Boolean);

  let element = route.element;

  // Parents' layouts
  [...parents].reverse().forEach((parent) => {
    if (parent.layout) {
      const Layout = parent.layout;
      element = <Layout>{element}</Layout>;
    }
  });

  // Route's own layout
  if (route.layout) {
    const Layout = route.layout;
    element = <Layout>{element}</Layout>;
  }

  return {
    id: route.id || generateRouteId(fullPath),
    element: element,
    loader: createLoader(allLoaders.concat(route.loader)),
    path: fullPath,
    pathRegex: pathToRegex(fullPath),
  };
}

function generateRouteId(path: string): string {
  return path.replace(/\W+/g, "-").replace(/^-|-$/g, "");
}

function createLoader(loaders: RouteDefinition["loader"][]) {
  return async ({ params, request }: { params: any; request: any }) => {
    try {
      const data = {};

      for (let i = 0; i < loaders.length; i++) {
        const loader = loaders[i]!;
        const result = await loader({ params, request });

        Object.assign(data, result);
      }

      return data;
    } catch (error) {
      throw error;
    }
  };
}

function pathToRegex(path: string) {
  return new RegExp("^" + path.replace(/:([a-zA-Z0-9_]+)/g, "(?<$1>[^/]+)") + "$");
}

export function matchPath(routes: Route[], path: string): { route: Route; params: any } | null {
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]!;
    const match = path.match(route.pathRegex);

    if (match) {
      return {
        route,
        params: match.groups,
      };
    }
  }

  return null;
}
