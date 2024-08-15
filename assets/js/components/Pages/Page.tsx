import React from "react";

import { useDocumentTitle } from "@/layouts/header";

interface PageProps {
  title: string | string[];
  children: React.ReactNode;
  testID?: string;
}

export function Page({ title, children, testID }: PageProps): JSX.Element {
  useDocumentTitle(title);

  return <div data-test-id={testID}>{children}</div>;
}
