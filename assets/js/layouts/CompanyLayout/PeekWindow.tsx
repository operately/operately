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
  const matchedRoutes = matchRoutes(routes, path);
  if (!matchedRoutes || matchedRoutes.length === 0) return null;

  // Get the most specific (deepest) match
  const matchedRoute = matchedRoutes[matchedRoutes.length - 1];
  if (!matchedRoute || !matchedRoute.route) return null;

  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    const loadData = async () => {
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
      }
    };

    loadData();
  }, [path]);

  if (!data) return null;

  return (
    <LoaderDataContext.Provider value={data}>
      <PeekLayout path={path} element={matchedRoute.route.element} />;
    </LoaderDataContext.Provider>
  );
}

function PeekLayout({ path, element }: { path: string; element: React.ReactNode }) {
  return (
    <div className="bg-stone-500/40 absolute top-0 left-0 right-0 bottom-0 z-[1000]">
      <div className="absolute inset-36 bg-surface-base p-4 rounded-lg">
        <div className="text-lg font-bold">Peek Window</div>
        <div className="text-sm">Path: {path}</div>

        <ErrorBoundary fallback={<div>Error loading peek window</div>}>{element}</ErrorBoundary>

        <div className="absolute top-4 right-4">
          <button onClick={() => {}} className="bg-surface-base text-primary-base px-2 py-1 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
