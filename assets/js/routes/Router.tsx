import React from "react";

import { matchPath, Route } from "./createRoutes";
import { REDIRECT_EVENT, RedirectError } from "./redirect";
import ErrorPage from "./ErrorPage";

interface NavigationOptions {
  openPeekWindow?: boolean;
  exitPeekWindow?: boolean;
}

interface LoaderController {
  abortLoader: () => void;
  createLoader: () => AbortController;
  clearLoader: (controller: AbortController) => void;
}

interface RouterContextValue {
  loadedData: any;
  error: any;
  location: Location;
  navigate: (path: string, opts?: NavigationOptions) => void;
  revalidate: () => void;

  isPeekWindowOpen: boolean;
  peekWindowData: any;
  peekWindowElement: React.ReactNode | null;
  closePeekWindow: () => void;
  expandPeekWindow: () => void;
}

type RouteStatus = "loading" | "loaded" | "error";

interface RouterState {
  location: Location;

  // Main route state
  status: RouteStatus;
  element: React.ReactNode | null;
  data: any;
  error: any;
  pathname: string;

  // Peek window state
  peekStatus: RouteStatus;
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
  | { type: "CLOSE_PEEK_WINDOW" }
  | { type: "PEEK_LOAD_DATA_SUCCESS"; data: any; pathname: string | null; element: React.ReactNode }
  | { type: "PEEK_LOAD_DATA_ERROR"; error: any; pathname: string | null };

function routerReducer(state: RouterState, action: RouterAction): RouterState {
  switch (action.type) {
    case "NAVIGATE":
      return {
        ...state,
        status: "loading",
        pathname: action.pathname,
        error: null,
      };

    case "LOAD_DATA_SUCCESS":
      if (action.pathname !== state.pathname) return state;
      return {
        ...state,
        status: "loaded",
        data: action.data,
        location: window.location,
        element: action.element,
      };

    case "LOAD_DATA_ERROR":
      if (action.pathname !== state.pathname) return state;
      return {
        ...state,
        status: "error",
        error: action.error,
      };

    case "PEEK_NAVIGATE":
      return {
        ...state,
        peekStatus: "loading",
        peekPathname: action.pathname,
        peekError: null,
      };

    case "CLOSE_PEEK_WINDOW":
      return {
        ...state,
        peekPathname: null,
        peekError: null,
        peekData: null,
        peekElement: null,
      };

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
      return {
        ...state,
        peekStatus: "error",
        peekError: action.error,
      };
  }
}

function initializeState(): RouterState {
  const searchParams = new URLSearchParams(window.location.search);

  return {
    location: window.location,

    pathname: window.location.pathname,
    status: "loading",
    element: null,
    data: null,
    error: null,

    peekPathname: searchParams.get("peek"),
    peekStatus: "loading",
    peekElement: null,
    peekData: null,
    peekError: null,
  };
}

export function Router({ routes }: { routes: Route[] }) {
  const [state, dispatch] = React.useReducer(routerReducer, initializeState());

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

  const mainLoaderController = useDataLoaderController();
  const peekLoaderController = useDataLoaderController();

  useNavigationEvents(dispatch, mainLoaderController, peekLoaderController);
  const navigate = useNavigation(dispatch, mainLoaderController, peekLoaderController);

  const loadMainRouteData = useRouteDataLoader(
    match,
    match?.route.element,
    state.pathname,
    (data, element) => dispatch({ type: "LOAD_DATA_SUCCESS", data, pathname: state.pathname, element }),
    (error) => dispatch({ type: "LOAD_DATA_ERROR", error, pathname: state.pathname }),
    mainLoaderController,
  );

  const loadPeekRouteData = useRouteDataLoader(
    peekWindowMatch,
    peekWindowMatch?.route.elementWithoutLayout,
    peekPath,
    (data, element) => dispatch({ type: "PEEK_LOAD_DATA_SUCCESS", data, pathname: peekPath, element }),
    (error) => dispatch({ type: "PEEK_LOAD_DATA_ERROR", error, pathname: peekPath }),
    peekLoaderController,
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

  const closePeekWindow = React.useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("peek");
    window.history.pushState({}, "", url);

    dispatch({ type: "CLOSE_PEEK_WINDOW" });
  }, []);

  const expandPeekWindow = React.useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const peekPath = searchParams.get("peek");

    if (peekPath) {
      navigate(peekPath, { exitPeekWindow: true });
    }
  }, [navigate, location.search]);

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
    expandPeekWindow,
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

function useDataLoaderController(): LoaderController {
  const loaderRef = React.useRef<AbortController | null>(null);

  const abortLoader = React.useCallback(() => {
    if (loaderRef.current) {
      loaderRef.current.abort();
      loaderRef.current = null;
    }
  }, []);

  const createLoader = React.useCallback(() => {
    abortLoader();

    const abortController = new AbortController();
    loaderRef.current = abortController;

    return abortController;
  }, [abortLoader]);

  const clearLoader = React.useCallback((controller: AbortController) => {
    if (loaderRef.current === controller) {
      loaderRef.current = null;
    }
  }, []);

  return { abortLoader, createLoader, clearLoader };
}

function useNavigation(
  dispatch: React.Dispatch<RouterAction>,
  mainLoader: LoaderController,
  peekLoader: LoaderController,
) {
  const navigate = React.useCallback(
    (path: string, opts?: NavigationOptions) => {
      const currentUrl = new URL(window.location.href);
      const isPeekWindow = currentUrl.searchParams.has("peek");

      if ((opts?.openPeekWindow || isPeekWindow) && !opts?.exitPeekWindow) {
        peekLoader.abortLoader();

        const url = new URL(window.location.href);
        url.searchParams.set("peek", path);
        window.history.pushState({}, "", url);

        dispatch({ type: "PEEK_NAVIGATE", pathname: path });
      } else {
        mainLoader.abortLoader();

        const url = new URL(path, window.location.href);
        window.history.pushState({}, "", url);

        dispatch({ type: "NAVIGATE", pathname: url.pathname });
      }
    },
    [dispatch, mainLoader.abortLoader, peekLoader.abortLoader],
  );

  return navigate;
}

function useNavigationEvents(
  dispatch: React.Dispatch<RouterAction>,
  mainLoader: LoaderController,
  peekLoader: LoaderController,
) {
  React.useEffect(() => {
    const handlePopState = () => {
      mainLoader.abortLoader();
      dispatch({ type: "NAVIGATE", pathname: window.location.pathname });

      const searchParams = new URLSearchParams(window.location.search);
      const peekPath = searchParams.get("peek");

      if (peekPath) {
        peekLoader.abortLoader();
        dispatch({ type: "PEEK_NAVIGATE", pathname: peekPath });
      } else {
        dispatch({ type: "PEEK_NAVIGATE", pathname: null });
      }
    };

    const handleRedirect = (e: CustomEvent) => {
      mainLoader.abortLoader();
      peekLoader.abortLoader();
      dispatch({ type: "NAVIGATE", pathname: e.detail?.destination });
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener(REDIRECT_EVENT, handleRedirect as EventListener);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(REDIRECT_EVENT, handleRedirect as EventListener);
    };
  }, [dispatch, mainLoader.abortLoader, peekLoader.abortLoader]);
}

function useRouteDataLoader(
  match: ReturnType<typeof matchPath> | null,
  element: React.ReactNode,
  pathname: string | null,
  onSuccess: (data: any, element: React.ReactNode) => void,
  onError: (error: any) => void,
  loaderController: LoaderController,
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
