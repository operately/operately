import { useEffect } from "react";
import { showErrorToast } from "turboui";

export function usePeopleSearchError({ error, errorUpdatedAt }: { error: Error | null; errorUpdatedAt: number }) {
  useEffect(() => {
    if (error) showErrorToast("Couldn't load people", "Please try again.");
  }, [error, errorUpdatedAt]);
}
