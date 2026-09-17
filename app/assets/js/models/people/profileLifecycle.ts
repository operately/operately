import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

async function invalidateProfileQueries(client: QueryClient): Promise<void> {
  // A manager change also changes other people's reports and peers.
  const prefixes = [
    Api.people.getQueryKeyPrefix(),
    Api.people.getMeQueryKeyPrefix(),
    Api.people.listQueryKeyPrefix(),
    Api.companies.getFlatWorkMapQueryKeyPrefix(),
    Api.companies.getWorkMapQueryKeyPrefix(),
    // Company administration embeds people in the admin and owner lists.
    Api.companies.getQueryKeyPrefix(),
  ];

  await Promise.all(prefixes.map((queryKey) => client.invalidateQueries({ queryKey })));
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    ...Api.people.updateMutationOptions(),
    onSuccess: () => invalidateProfileQueries(client),
  });
}

export function useUpdateProfilePicture() {
  const client = useQueryClient();
  return useMutation({
    ...Api.people.updatePictureMutationOptions(),
    onSuccess: () => invalidateProfileQueries(client),
  });
}
