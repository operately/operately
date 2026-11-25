import React from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import Api, { type WorkMapsGetSettingsInput, type WorkMapsGetSettingsResult } from "@/api";
import { invalidateWorkMapQueries, useSaveWorkMapSettings } from "@/models/workMap";
import { idWithoutComments } from "@/routes/paths";
import { showErrorToast, type WorkMapV2PageProps } from "turboui";

export function useOrganization(
  settings: WorkMapsGetSettingsResult,
  scope: WorkMapsGetSettingsInput,
): WorkMapV2PageProps["organization"] {
  const { t } = useTranslation();
  const client = useQueryClient();
  const layout = useSaveWorkMapSettings();
  const reparentable = React.useMemo(
    () => new Set(settings.reparentableItemIds.map(idWithoutComments)),
    [settings.reparentableItemIds],
  );

  if (!settings.canEdit) return undefined;

  return {
    canReparent: (id) => reparentable.has(idWithoutComments(id)),
    save: async (orderedItemIds, parentChanges) => {
      try {
        await layout.mutateAsync({ ...scope, orderedItemIds, parentChanges });
        if (parentChanges.length) {
          await Promise.all([
            invalidateWorkMapQueries(client),
            client.invalidateQueries({ queryKey: Api.goals.getQueryKeyPrefix() }),
            client.invalidateQueries({ queryKey: Api.goals.countChildrenQueryKeyPrefix() }),
            client.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix() }),
          ]);
        }
        return true;
      } catch {
        showErrorToast(t("Couldn’t save the map order"), t("Please try again."));
        return false;
      }
    },
  };
}
