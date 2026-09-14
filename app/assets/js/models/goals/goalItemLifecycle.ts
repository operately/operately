import Api from "@/api";
import { useGoalMutation } from "./goalMutation";

export function useCreateGoalTarget() {
  return useGoalMutation(Api.goals.createTargetMutationOptions());
}

export function useDeleteGoalTarget() {
  return useGoalMutation(Api.goals.deleteTargetMutationOptions());
}

export function useUpdateGoalTarget() {
  return useGoalMutation(Api.goals.updateTargetMutationOptions());
}

export function useUpdateGoalTargetValue() {
  return useGoalMutation(Api.goals.updateTargetValueMutationOptions());
}

export function useUpdateGoalTargetIndex() {
  return useGoalMutation(Api.goals.updateTargetIndexMutationOptions());
}

export function useCreateGoalCheck() {
  return useGoalMutation(Api.goals.createCheckMutationOptions());
}

export function useDeleteGoalCheck() {
  return useGoalMutation(Api.goals.deleteCheckMutationOptions());
}

export function useUpdateGoalCheck() {
  return useGoalMutation(Api.goals.updateCheckMutationOptions());
}

export function useToggleGoalCheck() {
  return useGoalMutation(Api.goals.toggleCheckMutationOptions());
}

export function useUpdateGoalCheckIndex() {
  return useGoalMutation(Api.goals.updateCheckIndexMutationOptions());
}
