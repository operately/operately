import { createAccountMutationOptions, createEmailActivationCodeMutationOptions } from "@/api";
import { useMutation } from "@tanstack/react-query";

export function useCreateEmailActivationCode() {
  return useMutation(createEmailActivationCodeMutationOptions());
}

export function useCreateAccount() {
  return useMutation(createAccountMutationOptions());
}
