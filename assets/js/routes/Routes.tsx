import React from "react";
import { matchPath } from "./createRoutes";

const Context = React.createContext<any>(null);

export function Routes({ routes }) {
  const match = React.useMemo(() => {
    return matchPath(routes, window.location.pathname);
  }, [routes, window.location.pathname]);

  const [state, setState] = React.useState({
    status: "loading",
    data: {},
  });

  React.useEffect(() => {
    if (match) {
      const request = new Request(window.location.href);

      match.route.loader({ params: match.params, request: request }).then((data) => {
        setState({
          status: "loaded",
          data,
        });
      });
    }
  }, [match]);

  if (match) {
    return (
      <Context.Provider value={{ loadedData: state.data }}>
        {state.status === "loaded" ? match.route.element : null}
      </Context.Provider>
    );
  } else {
    return <div>Page not found</div>;
  }
}

export function useLoadedData() {
  const context = React.useContext(Context);
  return context.loadedData;
}
