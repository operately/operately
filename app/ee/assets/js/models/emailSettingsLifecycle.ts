import * as AdminApi from "@/ee/admin_api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateEmailSettings() {
  const client = useQueryClient();
  const key = AdminApi.getEmailSettingsQueryKey({});

  return useMutation({
    ...AdminApi.updateEmailSettingsMutationOptions(),
    onSuccess: async (result) => {
      if (!result.success) return;
      await client.cancelQueries({ queryKey: key, exact: true });
      client.setQueryData(key, { emailSettings: result.emailSettings });
    },
  });
}

export function useSendTestEmail() {
  return useMutation(AdminApi.sendTestEmailMutationOptions());
}
