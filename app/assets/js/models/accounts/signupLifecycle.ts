import { createAccountMutationOptions, createEmailActivationCodeMutationOptions } from "@/api";
import { useMutation } from "@tanstack/react-query";

export function useCreateEmailActivationCode() {
  return useMutation({ ...createEmailActivationCodeMutationOptions(), gcTime: 0, retry: false });
}

export function useCreateAccount() {
  return useMutation({ ...createAccountMutationOptions(), gcTime: 0, retry: false });
}
