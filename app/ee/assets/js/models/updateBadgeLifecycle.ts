import * as AdminApi from "@/ee/admin_api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateUpdateBadgeSettings() {
  const client = useQueryClient();
  const key = AdminApi.getUpdateBadgeSettingsQueryKey({});

  return useMutation({
    ...AdminApi.updateUpdateBadgeSettingsMutationOptions(),
    onSuccess: async (result) => {
      if (!result.success) return;
      await client.cancelQueries({ queryKey: key, exact: true });
      client.setQueryData(key, { enabled: result.enabled });
    },
  });
}
