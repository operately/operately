export { Task } from "@/gql";
import { gql, useMutation } from "@apollo/client";

export function useCreateTaskMutation(options?: any) {
  return useMutation(
    gql`
      mutation CreateTask($input: CreateTaskInput!) {
        createTask(input: $input) {
          id
        }
      }
    `,
    options,
  );
}
