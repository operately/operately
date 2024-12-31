import React from "react";

import * as Paper from "@/components/PaperContainer";
import { ResourceHubFolder } from "@/models/resourceHubs";

export function NestedFolderNavigation({ folders }: { folders: ResourceHubFolder[] }) {
  return (
    <>
      {folders.map((folder) => (
        <React.Fragment key={folder.id}>
          <Paper.NavSeparator />
          <Paper.NavFolderLink folder={folder} />
        </React.Fragment>
      ))}
    </>
  );
}
