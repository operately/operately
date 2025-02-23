import React from "react";

import { useDocumentTitle } from "@/layouts/header";
import { useRefresh } from "./useRefresh";

interface PageProps {
  title: string | string[];
  children: React.ReactNode;
  testId?: string;
  onLoad?: () => void;
}

export function Page({ title, children, testId, onLoad }: PageProps): JSX.Element {
  const refresh = useRefresh();

  React.useEffect(() => {
    refresh();
  }, []);

  useDocumentTitle(title);

  React.useEffect(() => {
    if (onLoad) onLoad();
  }, []);

  return <div data-test-id={testId}>{children}</div>;
}
