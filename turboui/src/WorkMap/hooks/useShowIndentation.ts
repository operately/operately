import { useMemo } from "react";
import WorkMap from "../components";

export function useShowIndentation(items: WorkMap.Item[]) {
  const showIndentation = useMemo(() => {
    let show = false;

    for (const item of items) {
      if (item.children.length > 0) {
        show = true;
        break;
      }
    }

    return show;
  }, [items]);

  return showIndentation;
}
