import Api, { EmailChangeState, EmailChangeOutcome } from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateEmailChangeProfiles(client: QueryClient): Promise<void> {
  const prefixes = [
    Api.people.getAccountQueryKeyPrefix(),
    Api.people.getMeQueryKeyPrefix(),
    Api.people.getQueryKeyPrefix(),
    Api.people.listQueryKeyPrefix(),
    Api.email_changes.getQueryKeyPrefix(),
  ];

  // Email changes affect every company. Match generated endpoint prefixes while
  // deliberately ignoring the company-specific request headers at index 2.
  await client.invalidateQueries({
    predicate: ({ queryKey }) =>
      prefixes.some((prefix) => queryKey[0] === prefix[0] && queryKey[1] === prefix[1] && queryKey[3] === prefix[3]),
  });
}

function useUpdateEmailChangeState() {
  const client = useQueryClient();
  return (result: { state: EmailChangeState; outcome: EmailChangeOutcome }) => {
    const prefix = Api.email_changes.getQueryKeyPrefix();
    client.setQueriesData(
      {
        predicate: ({ queryKey }) =>
          queryKey[0] === prefix[0] && queryKey[1] === prefix[1] && queryKey[3] === prefix[3],
      },
      { state: result.state },
    );
    client.setQueryData(Api.email_changes.getQueryKey({}), { state: result.state });
  };
}

export function useRequestEmailChange() {
  const update = useUpdateEmailChangeState();
  return useMutation({ ...Api.email_changes.requestMutationOptions(), onSuccess: update });
}

export function useVerifyCurrentEmail() {
  const update = useUpdateEmailChangeState();
  return useMutation({ ...Api.email_changes.verifyCurrentMutationOptions(), onSuccess: update });
}

export function useResendEmailChange() {
  const update = useUpdateEmailChangeState();
  return useMutation({ ...Api.email_changes.resendMutationOptions(), onSuccess: update });
}

export function useCancelEmailChange() {
  const update = useUpdateEmailChangeState();
  return useMutation({ ...Api.email_changes.cancelMutationOptions(), onSuccess: update });
}

export function useConfirmEmailChange(onConfirmed: (email: string) => void) {
  const client = useQueryClient();
  const update = useUpdateEmailChangeState();
  return useMutation({
    ...Api.email_changes.confirmMutationOptions(),
    onSuccess: async (result) => {
      // Show confirmation before clearing the pending request and refreshing profiles.
      if (result.outcome === "success") onConfirmed(result.state.currentEmail);
      update(result);
      if (result.outcome === "success") await invalidateEmailChangeProfiles(client);
    },
  });
}
