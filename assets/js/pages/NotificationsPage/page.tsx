import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";
import { useDocumentTitle } from "@/layouts/header";

export function Page() {
  const data = useLoadedData();

  useDocumentTitle("NotificationsPage");

  return (
    <Paper.Root>
      <Paper.Body>
        <div className="text-white-1 text-3xl font-extrabold">NotificationsPage</div>
      </Paper.Body>
    </Paper.Root>
  );
}
