import React from "react";
import { matchPath, Route } from "./createRoutes";

interface Router {
  loadedData: any;
  error: any;
  location: Location;
  navigate: (path: string) => void;
  revalidate: () => void;
}

interface State {
  status: "loading" | "loaded";
  data: any;
  error: any;
  location: Location;
  pathname: string;
}

type RouterAction =
  | { type: "NAVIGATE"; pathname: string }
  | { type: "LOAD_DATA_START" }
  | { type: "LOAD_DATA_SUCCESS"; data: any }
  | { type: "LOAD_DATA_ERROR"; error: any };

function routerReducer(state: State, action: RouterAction): State {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, pathname: action.pathname, status: "loading" };
    case "LOAD_DATA_START":
      return { ...state, status: "loading" };
    case "LOAD_DATA_SUCCESS":
      return { ...state, status: "loaded", data: action.data, location: window.location };
    case "LOAD_DATA_ERROR":
      return { ...state, status: "loaded", error: action.error };
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

  const match = React.useMemo(() => {
    return matchPath(routes, state.pathname);
  }, [routes, state.pathname]);

  const navigate = React.useCallback((path: string) => {
    const url = new URL(path, window.location.href);
    window.history.pushState({}, "", url);
    dispatch({ type: "NAVIGATE", pathname: url.pathname });
  }, []);

  const loadData = React.useCallback(
    async (opts?: { skipLoading: boolean }) => {
      if (!match) return;

      try {
        if (!opts?.skipLoading) dispatch({ type: "LOAD_DATA_START" });

        const request = new Request(window.location.href);
        const data = await match.route.loader({
          params: match.params,
          request,
        });

        dispatch({ type: "LOAD_DATA_SUCCESS", data });
      } catch (error) {
        dispatch({ type: "LOAD_DATA_ERROR", error });
      }
    },
    [match],
  );

  React.useEffect(() => {
    const handlePopState = () => {
      dispatch({ type: "NAVIGATE", pathname: window.location.pathname });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
