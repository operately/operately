import React from "react";
import { StatusBadge } from "../../../StatusBadge";
import { WorkMap } from "..";
import { StatusSelector } from "../../../StatusSelector";
import { showErrorToast } from "../../../Toasts";
import { useTranslation } from "react-i18next";

interface Props {
  item: WorkMap.Item;
  hide?: boolean;
  onTaskStatusChange?: WorkMap.TaskStatusChangeFn;
}

export function StatusCell({ item, hide, onTaskStatusChange }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = React.useState(false);
  const [optimisticStatus, setOptimisticStatus] = React.useState<StatusSelector.StatusOption>();
  const displayedStatus = optimisticStatus ?? item.taskStatus;

  React.useEffect(() => {
    setOptimisticStatus(undefined);
  }, [item.taskStatus?.id]);

  if (hide) return null;

  const canEdit = item.type === "task" && item.canEditTask && onTaskStatusChange && !!item.taskStatuses?.length;

  const changeStatus = async (status: StatusSelector.StatusOption) => {
    if (!canEdit || saving || status.id === displayedStatus?.id) return;

    const previousStatus = displayedStatus;
    setOptimisticStatus(status);
    setSaving(true);
    try {
      await onTaskStatusChange(item, status);
    } catch {
      setOptimisticStatus(previousStatus ?? undefined);
      showErrorToast(t("Error"), t("Failed to update task status."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <td className="py-2 px-2 md:px-4">
      {canEdit ? (
        <StatusSelector
          status={displayedStatus}
          statusOptions={item.taskStatuses ?? []}
          onChange={changeStatus}
          readonly={saving}
          showFullBadge
          size="sm"
          testId={`task-status-${item.id}`}
        />
      ) : (
        <StatusBadge status={item.taskStatus || item.status} />
      )}
    </td>
  );
}
