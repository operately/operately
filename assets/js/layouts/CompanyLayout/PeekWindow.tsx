import React from "react";
import { routes } from "@/routes";

import { matchRoutes, useSearchParams } from "react-router-dom";
import { ErrorBoundary } from "@sentry/react";

const Context = React.createContext<{ active: boolean } | null>(null);
const LoaderDataContext = React.createContext<any | null>(null);

export function usePeekContext() {
  return React.useContext(Context);
}

export function usePeekLoaderData() {
  return React.useContext(LoaderDataContext);
}

export function PeekWindow() {
  const context = usePeekContext();
  if (context) return null;

  const path = usePeekPath();

  return <Context.Provider value={{ active: !!path }}>{path && <PeekWindowContent path={path} />}</Context.Provider>;
}

function usePeekPath(): string | null {
  const [params] = useSearchParams();
  return params.get("peek");
}

function PeekWindowContent({ path }: { path: string }) {
  const [element, setElement] = React.useState(null);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    const loadData = async () => {
      const matchedRoutes = matchRoutes(routes, path);
      if (!matchedRoutes || matchedRoutes.length === 0) return null;

      // Get the most specific (deepest) match
      const matchedRoute = matchedRoutes[matchedRoutes.length - 1];
      if (!matchedRoute || !matchedRoute.route) return null;

      if (!matchedRoute) return;

      const route = matchedRoute.route;

      if (route["loader"]) {
        const loader = route["loader"] as any as (props: any) => Promise<any>;

        const result = await loader({
          params: matchedRoute.params,
          request: new Request(path),
        });

        console.log("PeekWindowContent", result);

        setData(result);
        setElement(route.element);
      }

      return null;
    };

    loadData();
  }, [path]);

  return (
    <LoaderDataContext.Provider value={data}>
      <div className="bg-stone-500/40 absolute top-0 left-0 right-0 bottom-0 z-[1000]">
        <div className="absolute inset-36 bg-surface-base p-4 rounded-lg overflow-auto">
          <div className="text-lg font-bold">Peek Window</div>
          <div className="text-sm">Path: {path}</div>

          {data ? (
            <ErrorBoundary fallback={<div>Error loading peek window</div>}>{element}</ErrorBoundary>
          ) : (
            <div>Loading...</div>
          )}

          <div className="absolute top-4 right-4">
            <button onClick={() => {}} className="bg-surface-base text-primary-base px-2 py-1 rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    </LoaderDataContext.Provider>
  );
}
