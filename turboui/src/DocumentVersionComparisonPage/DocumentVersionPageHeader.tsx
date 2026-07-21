import React from "react";

import { DiffLegend } from "../RichContentDiff";

type Props = {
  title: string;
  showLegend?: boolean;
};

export function DocumentVersionPageHeader(props: Props) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-content-accent md:text-4xl">{props.title}</h1>
      {props.showLegend && <DiffLegend className="mt-3" />}
    </header>
  );
}
