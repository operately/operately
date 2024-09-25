import * as React from "react";
import * as Pages from "@/components/Pages";

import { AddChampion } from "./AddChampion";
import { AddReviewer } from "./AddReviewer";
import { AddContributors } from "./AddContributors";
import { LoaderResult } from "./loader";

import { match } from "ts-pattern";

export function Page() {
  const { contribType } = Pages.useLoadedData() as LoaderResult;

  return match(contribType)
    .with("contributor", () => <AddContributors />)
    .with("reviewer", () => <AddReviewer />)
    .with("champion", () => <AddChampion />)
    .exhaustive();
}
