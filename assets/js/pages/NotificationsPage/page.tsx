import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";

export function Page() {
  const data = useLoadedData();

  useDocumentTitle("NotificationsPage");

  return (
    <Paper.Root>
      <Paper.Body>
        <h1>NotificationsPage</h1>
      </Paper.Body>
    </Paper.Root>
  );
}
