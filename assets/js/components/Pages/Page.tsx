import React from "react";

import { useDocumentTitle } from "@/layouts/header";

interface PageProps {
  title: string | string[];
  children: React.ReactNode;
}

export function Page({ title, children }: PageProps): JSX.Element {
  useDocumentTitle(title);

  return <>{children}</>;
}
