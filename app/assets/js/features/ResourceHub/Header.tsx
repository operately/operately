import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";
import { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";

interface Props {
  resource: ResourceHub | ResourceHubFolder;
}

export function Header({ resource }: Props) {
  return (
    <Paper.Header
      actions={<Hub.AddFilesButton permissions={resource.permissions!} />}
      title={resource.name!}
      layout="title-center-actions-left"
      underline
    />
  );
}
