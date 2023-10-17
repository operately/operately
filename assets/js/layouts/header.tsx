import { useEffect } from "react";

export function useDocumentTitle(title: string | string[]) {
  useEffect(() => {
    const parts = Array.isArray(title) ? [...title, "Operately"] : [title, "Operately"];

    document.title = parts.join(" · ");
  }, [title]);

  useEffect(
    () => () => {
      document.title = "Operately";
    },
    [],
  );
}
