import React from "react";

import { useDocumentTitle } from "@/layouts/header";

interface PageProps {
  title: string | string[];
  children: React.ReactNode;
  testId?: string;
}

export function Page({ title, children, testId }: PageProps): JSX.Element {
  useDocumentTitle(title);

  return <div data-test-id={testId}>{children}</div>;
}
