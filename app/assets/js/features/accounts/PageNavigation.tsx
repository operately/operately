import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";

export function PageNavigation() {
  return <Paper.Navigation items={[{ to: Paths.accountPath(), label: "Account" }]} />;
}
