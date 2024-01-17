import * as Updates from "@/graphql/Projects/updates";

export function useAddReaction(entityID: string, entityType: "update" | "comment", onCompleted?: () => void) {
  const [postReaction, status] = Updates.useReactMutation({ onCompleted: onCompleted });

  return {
    submit: (type: string) => {
      postReaction({
        variables: {
          entityID: entityID,
          entityType: entityType,
          type: type,
        },
      });
    },
    loading: status.loading,
  };
}
