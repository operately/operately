import React, { useCallback } from "react";
import { matchPath, Route } from "./createRoutes";

interface Router {
  loadedData: any;
  location: string;
  navigate: (path: string) => void;
  revalidate: () => void;
}

interface State {
  status: "loading" | "loaded";
  data: any;
}

const Context = React.createContext<Router | undefined>(undefined);

export function Router({ routes }: { routes: Route[] }) {
  const [location, setLocation] = React.useState(window.location.pathname);
  const [state, setState] = React.useState<State>({
    status: "loading",
    data: {},
  });

  const setLoading = React.useCallback(
    () =>
      setState((prev) => {
        return { ...prev, status: "loading" };
      }),
    [setState],
  );

  const match = React.useMemo(() => {
    setLoading();
    return matchPath(routes, location);
  }, [routes, location]);

  const navigate = React.useCallback(
    (path: string) => {
      window.history.pushState({}, "", path);
      setLoading();
      setLocation(path);
    },
    [setLocation, setLoading],
  );

  const loadData = useCallback(async () => {
    if (!match) return;

    const request = new Request(window.location.href);
    const data = await match.route.loader({
      params: match.params,
      request: request,
    });

    setState({ status: "loaded", data });
  }, [match, setState]);

  React.useEffect(() => {
    const handlePopState = () => {
      setLocation(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setLocation]);

  React.useEffect(() => {
    if (match) {
      setLoading();
      loadData();
    }
  }, [match, loadData]);

  if (match) {
    return (
      <Context.Provider value={{ loadedData: state.data, location, navigate, revalidate: loadData }}>
        {state.status === "loaded" ? match.route.element : null}
      </Context.Provider>
    );
  } else {
    return <div>Page not found</div>;
  }
}

export function useRouter() {
  const context = React.useContext(Context);

  if (context === undefined) {
    throw new Error("useRouter must be used within a Router");
  }

  return context;
}
