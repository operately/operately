import { useTranslation } from "react-i18next";
import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import Modal from "../Modal";
import { ProjectField } from "../ProjectField";
import { SpaceField } from "../SpaceField";
import { Dropdown } from "../FormElements/Dropdown";
import { showErrorToast } from "../Toasts";
import type { TaskBoardSummary, TaskStatus } from "../ApiTypes";
import { InfoCallout, ErrorCallout } from "../Callouts";
import { compareIds } from "../utils/ids";
import { TaskPage } from "./types";

type Props = Pick<
  TaskPage.ContentState,
  | "isMoveModalOpen"
  | "closeMoveModal"
  | "onMoveTask"
  | "projectSearch"
  | "spaceSearch"
  | "loadMoveBoards"
  | "currentBoardId"
>;

export function MoveModal(props: Props) {
  const { t } = useTranslation();
  const [isMoving, setIsMoving] = React.useState(false);
  const [destinationType, setDestinationType] = React.useState<TaskPage.MoveDestinationType>("project");
  const [project, setProject] = React.useState<ProjectField.Project | null>(null);
  const [space, setSpace] = React.useState<SpaceField.Space | null>(null);

  const [boardId, setBoardId] = React.useState("");
  const [statuses, setStatuses] = React.useState<Pick<TaskStatus, "id" | "label">[] | null>(null);
  const [statusId, setStatusId] = React.useState("");
  const [boardsReload, setBoardsReload] = React.useState(0);
  const statusLabelId = React.useId();

  const selectBoard = React.useCallback((id: string) => {
    setBoardId(id);
    setStatuses(null);
    setStatusId("");
  }, []);

  React.useEffect(() => {
    if (!props.isMoveModalOpen) return;

    setDestinationType("project");
    setProject(null);
    setSpace(null);
    selectBoard("");
  }, [props.isMoveModalOpen, selectBoard]);

  if (!props.onMoveTask || !props.projectSearch || !props.spaceSearch) {
    return null;
  }

  const destinationId = destinationType === "project" ? project?.id : space?.id;

  const requiresBoard = destinationType === "space" && Boolean(props.loadMoveBoards);
  const canMove = Boolean(destinationId && (!requiresBoard || boardId) && (!statuses || statusId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destinationId || !canMove || isMoving) return;

    setIsMoving(true);

    try {
      const moved = await props.onMoveTask?.({
        destinationType,
        destinationId,
        ...(requiresBoard ? { destinationBoardId: boardId } : {}),
        ...(destinationType === "space" && statusId ? { destinationStatusId: statusId } : {}),
      });

      if (typeof moved === "object" && moved.status === "status_mapping_required") {
        setStatuses(moved.statuses);
        setStatusId("");
      } else if (typeof moved === "object" && moved.status === "board_unavailable") {
        selectBoard("");
        setBoardsReload((value) => value + 1);
        showErrorToast(t("Failed to move task"), t("This task board is archived. Restore it before making changes."));
      } else if (moved === true) {
        props.closeMoveModal();
      } else {
        showErrorToast(t("Failed to move task"), t("Please try again"));
      }
    } catch {
      showErrorToast(t("Failed to move task"), t("Please try again"));
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Modal
      isOpen={props.isMoveModalOpen}
      onClose={() => {
        if (!isMoving) props.closeMoveModal();
      }}
      size="small"
      title={t("Move task")}
    >
      <form className="space-y-6" onSubmit={handleSubmit} data-test-id="move-task-modal">
        <fieldset disabled={isMoving} className="space-y-6">
          <div>
            <label className="font-bold text-sm mb-1.5 block">{t("Destination type")}</label>
            <Dropdown
              testId="move-task-destination-type"
              items={[
                { id: "project", name: t("Project"), testId: "move-task-destination-project" },
                { id: "space", name: t("Space"), testId: "move-task-destination-space" },
              ]}
              value={destinationType}
              onSelect={(item) => {
                setDestinationType(item.id as TaskPage.MoveDestinationType);
                setSpace(null);
                setProject(null);
                selectBoard("");
              }}
            />
          </div>

          <div>
            <label className="font-bold text-sm mb-1.5 block">
              {destinationType === "project" ? t("Select destination project") : t("Select destination space")}
            </label>

            {destinationType === "project" ? (
              <ProjectField
                testId="move-task-project-field"
                project={project}
                setProject={setProject}
                search={props.projectSearch}
                variant="form-field"
              />
            ) : (
              <SpaceField
                testId="move-task-space-field"
                space={space}
                setSpace={(value) => {
                  setSpace(value);
                  if (value?.id !== space?.id) selectBoard("");
                }}
                search={props.spaceSearch}
                variant="form-field"
              />
            )}
          </div>

          {destinationType === "space" && space && props.loadMoveBoards && (
            <DestinationBoardField
              key={space.id}
              spaceId={space.id}
              currentBoardId={props.currentBoardId}
              loadBoards={props.loadMoveBoards}
              selectedBoardId={boardId}
              onSelect={selectBoard}
              reload={boardsReload}
            />
          )}

          {statuses && (
            <div className="space-y-3" data-test-id="move-task-status-mapping">
              <InfoCallout message={t("Choose a status for the destination board.")} />
              <label id={statusLabelId} className="font-bold text-sm block">
                {t("Destination status")}
              </label>
              <Dropdown
                ariaLabelledBy={statusLabelId}
                testId="move-task-status"
                items={statuses.map((status) => ({
                  id: status.id,
                  name: status.label,
                  testId: `move-task-status-${status.id}`,
                }))}
                value={statusId}
                onSelect={(status) => setStatusId(status.id)}
              />
            </div>
          )}
        </fieldset>

        <div className="flex items-center gap-2">
          <PrimaryButton
            size="sm"
            type="submit"
            loading={isMoving}
            disabled={isMoving || !canMove}
            testId="confirm-move-task"
          >
            {t("Move")}
          </PrimaryButton>
          <SecondaryButton size="sm" disabled={isMoving} onClick={props.closeMoveModal} testId="cancel-move-task">
            {t("Cancel")}
          </SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}

function DestinationBoardField({
  spaceId,
  currentBoardId,
  loadBoards,
  selectedBoardId,
  onSelect,
  reload,
}: {
  spaceId: string;
  currentBoardId?: string | null;
  loadBoards: NonNullable<Props["loadMoveBoards"]>;
  selectedBoardId: string;
  onSelect: (id: string) => void;
  reload: number;
}) {
  const { t } = useTranslation();
  const labelId = React.useId();
  const [boards, setBoards] = React.useState<TaskBoardSummary[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setBoards(null);
    setFailed(false);
    onSelect("");

    loadBoards(spaceId)
      .then((items) => {
        if (cancelled) return;
        const available = items.filter((board) => !board.archivedAt && !compareIds(board.id, currentBoardId));
        setBoards(available);
        onSelect(available.find((board) => board.isDefault)?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [spaceId, currentBoardId, loadBoards, onSelect, reload, attempt]);

  if (failed)
    return (
      <div className="space-y-2">
        <ErrorCallout message={t("Could not load boards.")} />
        <SecondaryButton size="sm" onClick={() => setAttempt((value) => value + 1)}>
          {t("Retry")}
        </SecondaryButton>
      </div>
    );
  if (!boards)
    return (
      <div role="status" className="text-sm text-content-dimmed">
        {t("Loading...")}
      </div>
    );
  if (boards.length === 0)
    return <InfoCallout testId="move-task-no-boards" message={t("No available boards in this space.")} />;

  return (
    <div>
      <label id={labelId} className="font-bold text-sm mb-1.5 block">
        {t("Destination board")}
      </label>
      <Dropdown
        ariaLabelledBy={labelId}
        testId="move-task-board"
        items={boards.map((board) => ({ ...board, testId: `move-task-board-${board.id}` }))}
        value={selectedBoardId}
        onSelect={(board) => onSelect(board.id)}
      />
    </div>
  );
}
