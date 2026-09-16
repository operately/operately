import { useEffect, useMemo } from "react";
import Api from "@/api";
import { compareIds } from "@/routes/paths";
import { QueryClient, useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { invalidateSpaceSummaryQueries } from "../spaces/spaceSummaryQueries";

type EditorScope = { templateId: string; spaceId: string };
type EditorOrigin = EditorScope & { mounted: boolean };

export async function invalidateTemplateEditorQueries(
  client: QueryClient,
  { templateId, spaceId }: EditorScope,
  refetchType: "active" | "none" = "none",
) {
  const prefix = Api.project_templates.getQueryKeyPrefix();
  const discussionPrefix = Api.project_templates.getDiscussionQueryKeyPrefix();
  await Promise.all([
    client.invalidateQueries({
      queryKey: prefix,
      refetchType,
      predicate: (query) => compareIds((query.queryKey[prefix.length] as { id?: string } | undefined)?.id, templateId),
    }),
    client.invalidateQueries({
      queryKey: discussionPrefix,
      refetchType,
      predicate: (query) =>
        compareIds(
          (query.queryKey[discussionPrefix.length] as { templateId?: string } | undefined)?.templateId,
          templateId,
        ),
    }),
    client.invalidateQueries({ queryKey: Api.project_templates.listQueryKeyPrefix() }),
    invalidateSpaceSummaryQueries(client, [spaceId], "none"),
  ]).catch((error) => console.error("Failed to refresh template queries", error));
}

function useTemplateEditorMutation<Result, Input>(
  options: UseMutationOptions<Result, Error, Input>,
  scope: EditorScope,
  refetchAfterNavigation: "active" | "none" = "active",
) {
  const client = useQueryClient();
  const { templateId, spaceId } = scope;

  // Defer refetching while this editor owns optimistic state. A save that
  // finishes after navigation must refresh the newly mounted editor instead.
  const origin = useMemo(() => ({ templateId, spaceId, mounted: true }), [templateId, spaceId]);
  useEffect(() => {
    origin.mounted = true;
    return () => {
      origin.mounted = false;
    };
  }, [origin]);

  return useMutation<Result, Error, Input, EditorOrigin>({
    ...options,
    mutationFn: async (input: Input, context) => {
      if (!options.mutationFn) throw new Error("Template mutation is unavailable");
      const result = await options.mutationFn(input, context);

      if (
        result === false ||
        (result && typeof result === "object" && "success" in result && result.success === false)
      ) {
        throw new Error("Template update failed");
      }

      return result;
    },
    onMutate: () => origin,
    onSuccess: (_result, _input, originalScope) =>
      invalidateTemplateEditorQueries(client, originalScope, originalScope.mounted ? "none" : refetchAfterNavigation),
  });
}

export function useUpdateTemplate(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateMutationOptions(), scope);
}

export function useCreateTemplateTask(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.createTaskMutationOptions(), scope);
}

export function useUpdateTemplateTask(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateTaskMutationOptions(), scope);
}

export function useUpdateTemplateTaskAssignees(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateTaskAssigneesMutationOptions(), scope);
}

export function useDeleteTemplateTask(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.deleteTaskMutationOptions(), scope);
}

export function useUpdateTemplateTaskMilestoneAndOrdering(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateMilestoneAndOrderingMutationOptions(), scope);
}

export function useCreateTemplateMilestone(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.createMilestoneMutationOptions(), scope);
}

export function useUpdateTemplateMilestone(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateMilestoneMutationOptions(), scope);
}

export function useDeleteTemplateMilestone(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.deleteMilestoneMutationOptions(), scope);
}

export function useCreateTemplatePerson(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.createPersonMutationOptions(), scope);
}

export function useUpdateTemplatePerson(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updatePersonMutationOptions(), scope);
}

export function useDeleteTemplatePerson(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.deletePersonMutationOptions(), scope);
}

export function useCreateTemplateFolder(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.createFolderMutationOptions(), scope);
}

export function useUpdateTemplateFolder(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateFolderMutationOptions(), scope);
}

export function useDeleteTemplateResource(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.deleteResourceMutationOptions(), scope);
}

export function useMoveTemplateResource(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.moveResourceMutationOptions(), scope);
}

export function useCreateTemplateFiles(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.createFilesMutationOptions(), scope);
}

export function useDuplicateTemplate(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.duplicateMutationOptions(), scope);
}

export function useArchiveTemplate(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.archiveMutationOptions(), scope);
}

export function useRestoreTemplate(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.restoreMutationOptions(), scope);
}

export function useDeleteTemplate(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.deleteMutationOptions(), scope, "none");
}

export function useCreateTemplateDiscussion(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.createDiscussionMutationOptions(), scope);
}

export function useUpdateTemplateDiscussion(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateDiscussionMutationOptions(), scope);
}

export function useCreateTemplateDocument(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.createDocumentMutationOptions(), scope);
}

export function useUpdateTemplateDocument(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateDocumentMutationOptions(), scope);
}

export function useCreateTemplateLink(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.createLinkMutationOptions(), scope);
}

export function useUpdateTemplateLink(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateLinkMutationOptions(), scope);
}

export function useUpdateTemplateFile(scope: EditorScope) {
  return useTemplateEditorMutation(Api.project_templates.updateFileMutationOptions(), scope);
}
