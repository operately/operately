import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Api from "@/api";
import i18n from "@/i18n";
import { showErrorToast, type ProjectPage, type MilestonePage } from "turboui";
import { useCreateMilestoneComment } from "./milestoneLifecycle";
import { parseTaskStatusesForTurboUi } from "../tasks";

type CompletionModalProps = NonNullable<ProjectPage.Props["completeMilestoneModal"]>;

type CompletionDetails = Pick<CompletionModalProps, "milestoneName" | "openTaskCount" | "closedStatuses"> & {
  milestoneId: string;
};

export function useMilestoneCompletion() {
  const queryClient = useQueryClient();
  const mutation = useCreateMilestoneComment();
  const loading = useRef(false);
  const [selection, setSelection] = useState<CompletionDetails | null>(null);

  const complete = async (milestoneId: string, resolution?: MilestonePage.OpenTasksResolution): Promise<boolean> => {
    try {
      await mutation.mutateAsync({
        milestoneId,
        content: null,
        action: "complete",
        openTasksResolution: resolution
          ? { action: resolution.action, statusId: resolution.action === "set_status" ? resolution.status.id : null }
          : null,
      });
      return true;
    } catch {
      showErrorToast(i18n.t("Error"), i18n.t("Failed to update milestone status."));
      return false;
    }
  };

  const requestCompletion = async (milestoneId: string): Promise<void> => {
    if (loading.current || selection) return;
    loading.current = true;

    try {
      // Overview/task data may be incomplete or stale. Check the whole milestone before completing it.
      const [{ milestone }, { tasks }] = await Promise.all([
        queryClient.fetchQuery({
          ...Api.projects.getMilestoneQueryOptions({
            id: milestoneId,
            includeProject: true,
            includePermissions: true,
            includeAvailableStatuses: true,
          }),
          staleTime: 0,
        }),
        queryClient.fetchQuery({ ...Api.projects.listMilestoneTasksQueryOptions({ milestoneId }), staleTime: 0 }),
      ]);

      if (!milestone.permissions?.canEdit) throw new Error("Milestone editing is not permitted");
      if (milestone.status === "done") return;

      const openTaskCount = tasks.filter((task) => !task.closedAt && !task.status?.closed).length;
      if (openTaskCount === 0) {
        await complete(milestoneId);
        return;
      }

      setSelection({
        milestoneId,
        milestoneName: milestone.title,
        openTaskCount,
        closedStatuses: parseTaskStatusesForTurboUi(milestone.availableStatuses).filter((status) => status.closed),
      });
    } catch {
      showErrorToast(i18n.t("Error"), i18n.t("Failed to update milestone status."));
    } finally {
      loading.current = false;
    }
  };

  const modalProps: CompletionModalProps | null = selection
    ? {
        ...selection,
        isOpen: true,
        onClose: () => setSelection(null),
        onComplete: (resolution) => complete(selection.milestoneId, resolution),
      }
    : null;

  return { requestCompletion, modalProps };
}
