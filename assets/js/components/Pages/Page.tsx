import React from "react";

import { useDocumentTitle } from "@/layouts/header";

type PageContextType = {
  mode: "view" | "edit";
  setMode: (mode: "view" | "edit") => void;
};

const PageContext = React.createContext<PageContextType>({
  mode: "view",
  setMode: () => {},
});

interface PageProps {
  title: string | string[];
  children: React.ReactNode;
  testId?: string;
  onLoad?: () => void;
  mode?: "view" | "edit";
}

export function Page(props: PageProps): JSX.Element {
  const [mode, setMode] = React.useState<"view" | "edit">(props.mode || "view");

  useDocumentTitle(props.title);

  React.useEffect(() => {
    if (props.onLoad) props.onLoad();
  }, []);

  return (
    <PageContext.Provider value={{ mode, setMode }}>
      <div data-test-id={props.testId}>{props.children}</div>;
    </PageContext.Provider>
  );
}

function usePageContext(): PageContextType {
  return React.useContext(PageContext);
}

export function usePageMode(): "view" | "edit" {
  return usePageContext().mode;
}

export function useSetPageMode(): (mode: "view" | "edit") => void {
  return usePageContext().setMode;
}
