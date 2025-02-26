import React from "react";

interface RouteDefinition {
  path: string;
  element: React.ReactNode;

  id?: string;
  loader?: (request: any) => Promise<any>;
  children?: RouteDefinition[];
  errorElement?: React.ReactNode;
}

interface Route {
  id: string;
  element: React.ReactNode;
  path: string;
  pathRegex: RegExp;

  loader: ({ params, request }: { params: any; request: any }) => Promise<any>;
}

export function createRoutes(routes: RouteDefinition[]): Route[] {
  const flatRoutes: Route[] = [];

  function flattenRoutes(routes: any, parents = []) {
    routes.forEach((route: any) => {
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

function createRoute(route: any, parents: any) {
  const fullPath = parents.reduce((acc: string, parent: RouteDefinition) => acc + parent.path, "") + route.path;
  const allLoaders = parents.map((parent: RouteDefinition) => parent.loader).filter(Boolean);

  return {
    id: route.id,
    element: route.element,
    loader: createLoader(allLoaders.concat(route.loader)),
    path: fullPath,
    pathRegex: pathToRegex(fullPath),
  };
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
  return new RegExp("^" + path.replace(/:(?<name>[a-zA-Z0-9_]+)/g, "(?<$<name>>[^/]+)") + "$");
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
