import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";

export function Options() {
  const { update } = useLoadedData();

  const mode = Pages.usePageMode();
  const setPageMode = Pages.useSetPageMode();
  const me = useMe()!;

  const isEditVisible = compareIds(me.id, update.author?.id) && mode === "view";

  return (
    <PageOptions.Root testId="check-in-options">
      {isEditVisible && (
        <PageOptions.Action
          icon={Icons.IconEdit}
          title="Edit"
          onClick={() => setPageMode("edit")}
          testId="edit-goal-definition"
          keepOutsideOnBigScreen
        />
      )}
    </PageOptions.Root>
  );
}
