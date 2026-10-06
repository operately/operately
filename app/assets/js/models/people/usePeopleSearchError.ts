import i18n from "@/i18n";
import { useEffect } from "react";
import { showErrorToast } from "turboui";

export function usePeopleSearchError({ error, errorUpdatedAt }: { error: Error | null; errorUpdatedAt: number }) {
  useEffect(() => {
    if (error) showErrorToast(i18n.t("Couldn't load people"), i18n.t("Please try again."));
  }, [error, errorUpdatedAt]);
}
