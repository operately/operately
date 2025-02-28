import React from "react";

import { matchPath, Route } from "./createRoutes";
import { REDIRECT_EVENT, RedirectError } from "./redirect";
import ErrorPage from "./ErrorPage";

interface RouterContextValue {
  loadedData: any;
  error: any;
  location: Location;
  navigate: (path: string, toPeekWindow?: boolean) => void;
  revalidate: () => void;

  isPeekWindowOpen: boolean;
  peekWindowData: any;
  peekWindowElement: React.ReactNode | null;
  closePeekWindow: () => void;
}

interface RouterState {
  location: Location;

  status: "loading" | "loaded" | "error";
  element: React.ReactNode | null;
  data: any;
  error: any;
  pathname: string;

  peekStatus: "loading" | "loaded" | "error";
  peekElement: React.ReactNode | null;
  peekData: any;
  peekPathname: string | null;
  peekError: any;
}

type RouterAction =
  | { type: "NAVIGATE"; pathname: string }
  | { type: "LOAD_DATA_SUCCESS"; data: any; pathname: string; element: React.ReactNode }
  | { type: "LOAD_DATA_ERROR"; error: any; pathname: string }
  | { type: "PEEK_NAVIGATE"; pathname: string | null }
  | { type: "PEEK_LOAD_DATA_SUCCESS"; data: any; pathname: string | null; element: React.ReactNode }
  | { type: "PEEK_LOAD_DATA_ERROR"; error: any; pathname: string | null };

function routerReducer(state: RouterState, action: RouterAction): RouterState {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, status: "loading", pathname: action.pathname, error: null };

    case "LOAD_DATA_SUCCESS":
      if (action.pathname !== state.pathname) return state;
      return { ...state, status: "loaded", data: action.data, location: window.location, element: action.element };

    case "LOAD_DATA_ERROR":
      if (action.pathname !== state.pathname) return state;
      return { ...state, status: "error", error: action.error };

    case "PEEK_NAVIGATE":
      return { ...state, peekStatus: "loading", peekPathname: action.pathname, peekError: null };

    case "PEEK_LOAD_DATA_SUCCESS":
      if (action.pathname !== state.peekPathname) return state;
      return {
        ...state,
        peekStatus: "loaded",
        peekData: action.data,
        location: window.location,
        peekElement: action.element,
      };

    case "PEEK_LOAD_DATA_ERROR":
      if (action.pathname !== state.peekPathname) return state;
      return { ...state, peekStatus: "error", peekError: action.error };
  }
}

const initialize = () => {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("peek");
};

export function Router({ routes }: { routes: Route[] }) {
  const [state, dispatch] = React.useReducer(routerReducer, {
    location: window.location,

    pathname: window.location.pathname,
    status: "loading",
    element: null,
    data: null,
    error: null,

    peekPathname: initialize(),
    peekStatus: "loading",
    peekElement: null,
    peekData: null,
    peekError: null,
  });

  const loaderController = useDataLoaderController();

  const match = React.useMemo(() => {
    return matchPath(routes, state.pathname);
  }, [routes, state.pathname]);

  const peekPath = React.useMemo(() => {
    const searchParams = new URLSearchParams(state.location.search);
    return searchParams.get("peek");
  }, [state.location.search]);

  const peekWindowMatch = React.useMemo(() => {
    if (!peekPath) return null;
    return matchPath(routes, peekPath);
  }, [routes, peekPath]);

  const isPeekWindowOpen = React.useMemo(() => {
    return peekPath !== null;
  }, [peekPath]);

  const closePeekWindow = React.useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("peek");
    window.history.pushState({}, "", url);

    dispatch({ type: "PEEK_NAVIGATE", pathname: null });
  }, []);

  useNavigationEvents(dispatch, loaderController.abortMainLoader, loaderController.abortPeekLoader);
  const navigate = useNavigation(dispatch, loaderController.abortMainLoader, loaderController.abortPeekLoader);

  const loadMainRouteData = useRouteDataLoader(
    match,
    match?.route.element,
    state.pathname,
    (data, element) => dispatch({ type: "LOAD_DATA_SUCCESS", data, pathname: state.pathname, element }),
    (error) => dispatch({ type: "LOAD_DATA_ERROR", error, pathname: state.pathname }),
    {
      createLoader: loaderController.createMainLoader,
      clearLoader: loaderController.clearMainLoader,
    },
  );

  const loadPeekRouteData = useRouteDataLoader(
    peekWindowMatch,
    peekWindowMatch?.route.elementWithoutLayout,
    peekPath,
    (data, element) => dispatch({ type: "PEEK_LOAD_DATA_SUCCESS", data, pathname: peekPath, element }),
    (error) => dispatch({ type: "PEEK_LOAD_DATA_ERROR", error, pathname: peekPath }),
    {
      createLoader: loaderController.createPeekLoader,
      clearLoader: loaderController.clearPeekLoader,
    },
  );

  React.useEffect(() => {
    if (state.pathname) {
      loadMainRouteData();
    }
  }, [state.pathname, loadMainRouteData]);

  React.useEffect(() => {
    if (peekPath) {
      loadPeekRouteData();
    }
  }, [peekPath, loadPeekRouteData]);

  const contextValue: RouterContextValue = {
    loadedData: state.data,
    error: state.error,
    location: state.location,
    navigate,
    revalidate: loadMainRouteData,

    isPeekWindowOpen,
    peekWindowData: state.peekData,
    peekWindowElement: state.peekElement,
    closePeekWindow,
  };

  if (match) {
    return (
      <RouterContext.Provider value={contextValue}>
        {state.status === "error" ? <ErrorPage /> : state.element}
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
  const mainLoaderRef = React.useRef<AbortController | null>(null);
  const peekLoaderRef = React.useRef<AbortController | null>(null);

  const abortMainLoader = React.useCallback(() => {
    if (mainLoaderRef.current) {
      mainLoaderRef.current.abort();
      mainLoaderRef.current = null;
    }
  }, []);

  const abortPeekLoader = React.useCallback(() => {
    if (peekLoaderRef.current) {
      peekLoaderRef.current.abort();
      peekLoaderRef.current = null;
    }
  }, []);

  const createMainLoader = React.useCallback(() => {
    abortMainLoader();

    const abortController = new AbortController();
    mainLoaderRef.current = abortController;

    return abortController;
  }, [abortMainLoader]);

  const createPeekLoader = React.useCallback(() => {
    abortPeekLoader();

    const abortController = new AbortController();
    peekLoaderRef.current = abortController;

    return abortController;
  }, [abortPeekLoader]);

  const clearMainLoader = React.useCallback((controller: AbortController) => {
    if (mainLoaderRef.current === controller) {
      mainLoaderRef.current = null;
    }
  }, []);

  const clearPeekLoader = React.useCallback((controller: AbortController) => {
    if (peekLoaderRef.current === controller) {
      peekLoaderRef.current = null;
    }
  }, []);

  return {
    abortMainLoader,
    abortPeekLoader,
    createMainLoader,
    createPeekLoader,
    clearMainLoader,
    clearPeekLoader,
  };
}

function useNavigation(
  dispatch: React.Dispatch<RouterAction>,
  abortMainLoader: () => void,
  abortPeekLoader: () => void,
) {
  const navigate = React.useCallback(
    (path: string, toPeekWindow?: boolean) => {
      if (toPeekWindow) {
        abortPeekLoader();

        const url = new URL(window.location.href);
        url.searchParams.set("peek", path);
        window.history.pushState({}, "", url);

        dispatch({ type: "PEEK_NAVIGATE", pathname: path });
      } else {
        abortMainLoader();

        const url = new URL(path, window.location.href);
        window.history.pushState({}, "", url);

        dispatch({ type: "NAVIGATE", pathname: url.pathname });
      }
    },
    [dispatch, abortMainLoader, abortPeekLoader],
  );

  return navigate;
}

function useNavigationEvents(
  dispatch: React.Dispatch<RouterAction>,
  abortMainLoader: () => void,
  abortPeekLoader: () => void,
) {
  React.useEffect(() => {
    const handlePopState = () => {
      abortMainLoader();
      dispatch({ type: "NAVIGATE", pathname: window.location.pathname });

      const searchParams = new URLSearchParams(window.location.search);
      const peekPath = searchParams.get("peek");

      if (peekPath) {
        abortPeekLoader();
        dispatch({ type: "PEEK_NAVIGATE", pathname: peekPath });
      } else {
        dispatch({ type: "PEEK_NAVIGATE", pathname: null });
      }
    };

    const handleRedirect = (e: CustomEvent) => {
      abortMainLoader();
      abortPeekLoader();
      dispatch({ type: "NAVIGATE", pathname: e.detail?.destination });
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener(REDIRECT_EVENT, handleRedirect as EventListener);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(REDIRECT_EVENT, handleRedirect as EventListener);
    };
  }, [dispatch, abortMainLoader, abortPeekLoader]);
}

function useRouteDataLoader(
  match: ReturnType<typeof matchPath> | null,
  element: React.ReactNode,
  pathname: string | null,
  onSuccess: (data: any, element: React.ReactNode) => void,
  onError: (error: any) => void,
  loaderController: { createLoader: () => AbortController; clearLoader: (controller: AbortController) => void },
) {
  const { createLoader, clearLoader } = loaderController;

  const loadData = React.useCallback(async () => {
    if (!match || !pathname) return;

    const abortController = createLoader();

    try {
      const request = new Request(pathname, {
        signal: abortController.signal,
      });

      const data = await match.route.loader({
        params: match.params,
        request,
      });

      onSuccess(data, element);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Data loading aborted");
        return;
      }
      if (error instanceof RedirectError) {
        console.log("Redirect detected during data loading");
        return;
      }

      onError(error);
    } finally {
      clearLoader(abortController);
    }
  }, [match, pathname, createLoader, clearLoader]);

  return loadData;
}
