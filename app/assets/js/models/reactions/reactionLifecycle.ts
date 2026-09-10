import Api from "@/api";
import { useMutation } from "@tanstack/react-query";

// The owning resource batches invalidation after its optimistic queue settles.
export function useCreateReaction() {
  return useMutation(Api.reactions.createMutationOptions());
}

export function useDeleteReaction() {
  return useMutation(Api.reactions.deleteMutationOptions());
}
