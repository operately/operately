import React from "react";

import { matchPath, Route } from "./createRoutes";
import { REDIRECT_EVENT, RedirectError } from "./redirect";

interface RouterContextValue {
  loadedData: any;
  error: any;
  location: Location;
  navigate: (path: string) => void;
  revalidate: () => void;
}

interface RouterState {
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

function routerReducer(state: RouterState, action: RouterAction): RouterState {
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

  const loaderController = useDataLoaderController();
  const { abortActiveLoader } = loaderController;

  const match = React.useMemo(() => {
    return matchPath(routes, state.pathname);
  }, [routes, state.pathname]);

  useNavigationEvents(dispatch, abortActiveLoader);
  const navigate = useNavigation(dispatch, abortActiveLoader);

  const loadData = useRouteDataLoader(match, state.pathname, dispatch, loaderController);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const contextValue: RouterContextValue = {
    loadedData: state.data,
    error: state.error,
    location: state.location,
    navigate,
    revalidate: () => loadData({ skipLoading: true }),
  };

  if (match) {
    return (
      <RouterContext.Provider value={contextValue}>
        {state.status === "loaded" ? match.route.element : null}
      </RouterContext.Provider>
    );
  } else {
    return <div>Page not found</div>;
  }
}

const RouterContext = React.createContext<RouterContextValue | undefined>(undefined);

export function useRouter() {
  const context = React.useContext(RouterContext);

  if (context === undefined) {
    throw new Error("useRouter must be used within a Router");
  }

  return context;
}

function useDataLoaderController() {
  const activeLoaderRef = React.useRef<AbortController | null>(null);

  const abortActiveLoader = React.useCallback(() => {
    if (activeLoaderRef.current) {
      activeLoaderRef.current.abort();
      activeLoaderRef.current = null;
    }
  }, []);

  const createLoader = React.useCallback(() => {
    abortActiveLoader();

    const abortController = new AbortController();
    activeLoaderRef.current = abortController;

    return abortController;
  }, [abortActiveLoader]);

  const clearLoader = React.useCallback((controller: AbortController) => {
    if (activeLoaderRef.current === controller) {
      activeLoaderRef.current = null;
    }
  }, []);

  return { abortActiveLoader, createLoader, clearLoader };
}

function useNavigation(dispatch: React.Dispatch<RouterAction>, abortActiveLoader: () => void) {
  const navigate = React.useCallback(
    (path: string) => {
      const url = new URL(path, window.location.href);
      window.history.pushState({}, "", url);

      abortActiveLoader();
      dispatch({ type: "NAVIGATE", pathname: url.pathname });
    },
    [dispatch, abortActiveLoader],
  );

  return navigate;
}

function useNavigationEvents(dispatch: React.Dispatch<RouterAction>, abortActiveLoader: () => void) {
  React.useEffect(() => {
    const handlePopState = () => {
      abortActiveLoader();
      dispatch({ type: "NAVIGATE", pathname: window.location.pathname });
    };

    const handleRedirect = (e: CustomEvent) => {
      abortActiveLoader();
      dispatch({ type: "NAVIGATE", pathname: e.detail?.destination });
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener(REDIRECT_EVENT, handleRedirect as EventListener);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(REDIRECT_EVENT, handleRedirect as EventListener);
    };
  }, [dispatch, abortActiveLoader]);
}

function useRouteDataLoader(
  match: ReturnType<typeof matchPath>,
  pathname: string,
  dispatch: React.Dispatch<RouterAction>,
  loaderController: ReturnType<typeof useDataLoaderController>,
) {
  const { createLoader, clearLoader } = loaderController;

  const loadData = React.useCallback(
    async (opts?: { skipLoading?: boolean }) => {
      if (!match) return;

      const abortController = createLoader();
      const currentPathname = pathname;

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
        if (currentPathname === pathname) {
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
        if (currentPathname === pathname) {
          dispatch({ type: "LOAD_DATA_ERROR", error, pathname: currentPathname });
        }
      } finally {
        clearLoader(abortController);
      }
    },
    [match, pathname, dispatch, createLoader, clearLoader],
  );

  return loadData;
}
