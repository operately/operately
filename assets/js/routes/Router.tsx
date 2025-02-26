import React from "react";

import { matchPath, Route } from "./createRoutes";
import { REDIRECT_EVENT, RedirectError } from "./redirect";

interface Router {
  loadedData: any;
  error: any;
  location: Location;
  navigate: (path: string) => void;
  revalidate: () => void;
}

interface State {
  status: "page-changed" | "loading" | "loaded" | "error";
  data: any;
  error: any;
  location: Location;
  pathname: string;
}

type RouterAction =
  | { type: "NAVIGATE"; pathname: string }
  | { type: "LOAD_DATA_START"; pathname: string }
  | { type: "LOAD_DATA_SUCCESS"; data: any; pathname: string }
  | { type: "LOAD_DATA_ERROR"; error: any; pathname: string };

function routerReducer(state: State, action: RouterAction): State {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, status: "page-changed", pathname: action.pathname };
    case "LOAD_DATA_START":
      if (action.pathname !== state.pathname) return state;
      return { ...state, status: "loading" };
    case "LOAD_DATA_SUCCESS":
      if (action.pathname !== state.pathname) return state;
      return { ...state, status: "loaded", data: action.data, location: window.location };
    case "LOAD_DATA_ERROR":
      if (action.pathname !== state.pathname) return state;
      return { ...state, status: "error", error: action.error };
  }
}

export function Router({ routes }: { routes: Route[] }) {
  const [state, dispatch] = React.useReducer(routerReducer, {
    pathname: window.location.pathname,
    status: "loading",
    data: null,
    error: null,
    location: window.location,
  });

  const activeLoaderRef = React.useRef<AbortController | null>(null);

  const abortActiveLoader = React.useCallback(() => {
    if (activeLoaderRef.current) {
      activeLoaderRef.current.abort();
      activeLoaderRef.current = null;
    }
  }, []);

  const match = React.useMemo(() => {
    return matchPath(routes, state.pathname);
  }, [routes, state.pathname]);

  const navigate = React.useCallback(
    (path: string) => {
      const url = new URL(path, window.location.href);
      window.history.pushState({}, "", url);

      abortActiveLoader();

      dispatch({ type: "NAVIGATE", pathname: url.pathname });
    },
    [abortActiveLoader],
  );

  const loadData = React.useCallback(
    async (opts?: { skipLoading?: boolean; signal?: AbortSignal }) => {
      if (!match) return;

      abortActiveLoader();

      // Create a new abort controller for this request
      const abortController = new AbortController();
      activeLoaderRef.current = abortController;

      const currentPathname = state.pathname;

      try {
        if (!opts?.skipLoading) {
          dispatch({ type: "LOAD_DATA_START", pathname: currentPathname });
        }

        const request = new Request(window.location.href, {
          signal: abortController.signal,
        });

        const data = await match.route.loader({
          params: match.params,
          request,
        });

        // Check if we're still on the same pathname
        if (currentPathname === state.pathname) {
          dispatch({ type: "LOAD_DATA_SUCCESS", data, pathname: currentPathname });
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Data loading aborted");
          return;
        }
        if (error instanceof RedirectError) {
          console.log("Redirect detected during data loading");
          return;
        }

        // Only dispatch error if we're still on the same pathname
        if (currentPathname === state.pathname) {
          dispatch({ type: "LOAD_DATA_ERROR", error, pathname: currentPathname });
        }
      } finally {
        // Clear the active loader ref if it's the current one
        if (activeLoaderRef.current === abortController) {
          activeLoaderRef.current = null;
        }
      }
    },
    [match, state.pathname, abortActiveLoader],
  );

  React.useEffect(() => {
    const handlePopState = () => {
      abortActiveLoader();
      dispatch({ type: "NAVIGATE", pathname: window.location.pathname });
    };
    const handleRedirect = (e) => {
      abortActiveLoader();
      dispatch({ type: "NAVIGATE", pathname: e.detail?.destination });
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener(REDIRECT_EVENT, handleRedirect);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(REDIRECT_EVENT, handleRedirect);
    };
  }, [abortActiveLoader]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (match) {
    return (
      <Context.Provider
        value={{
          loadedData: state.data,
          error: state.error,
          location: state.location,
          navigate,
          revalidate: () => loadData({ skipLoading: true }),
        }}
      >
        {state.status === "loaded" ? match.route.element : null}
      </Context.Provider>
    );
  } else {
    return <div>Page not found</div>;
  }
}

const Context = React.createContext<Router | undefined>(undefined);

export function useRouter() {
  const context = React.useContext(Context);

  if (context === undefined) {
    throw new Error("useRouter must be used within a Router");
  }

  return context;
}
