import React from "react";

import { useDocumentTitle } from "@/layouts/header";

interface PageProps {
  title: string | string[];
  children: React.ReactNode;
  testId?: string;
  onLoad?: () => void;
}

export function Page({ title, children, testId, onLoad }: PageProps): JSX.Element {
  useDocumentTitle(title);

  React.useEffect(() => {
    if (onLoad) onLoad();
  }, []);

  return (
    <div className="h-full" data-test-id={testId}>
      {children}
    </div>
  );
}
