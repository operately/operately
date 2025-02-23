import React from "react";
import { matchRoutes, useRoutes, useSearchParams } from "react-router-dom";
import { routes } from "@/routes";

const Context = React.createContext<{ active: boolean } | null>(null);

export function usePeekContext() {
  return React.useContext(Context);
}

export function PeekWindow() {
  const context = usePeekContext();
  if (context) return null;

  const path = usePeekPath();

  console.log(path);

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

  const element = useRoutes([matchedRoute.route], path);

  return (
    <div className="bg-stone-500/40 absolute top-0 left-0 right-0 bottom-0 z-[1000]">
      <div className="absolute inset-36 bg-surface-base p-4 rounded-lg">
        <div className="text-lg font-bold">Peek Window</div>
        <div className="text-sm">Path: {path}</div>

        {element}

        <div className="absolute top-4 right-4">
          <button onClick={() => {}} className="bg-surface-base text-primary-base px-2 py-1 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
