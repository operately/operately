import { useRef, useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title + " · Operately";
  }, [title]);

  useEffect(
    () => () => {
      document.title = "Operately";
    },
    [],
  );
}
