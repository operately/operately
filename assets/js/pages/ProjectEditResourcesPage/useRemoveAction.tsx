import * as React from "react";
import * as KeyResources from "@/models/key_resources";

import { useRefresh } from "./loader";

export function useRemoveAction(resource: KeyResources.KeyResource) {
  const refresh = useRefresh();

  const [remove] = KeyResources.useRemoveResource({
    onCompleted: refresh,
  });

  return React.useCallback(async () => {
    await remove({
      variables: {
        id: resource.id,
      },
    });
  }, [resource]);
}
