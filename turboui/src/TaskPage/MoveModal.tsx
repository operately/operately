import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import Modal from "../Modal";
import { ProjectField } from "../ProjectField";
import { SpaceField } from "../SpaceField";
import { Dropdown } from "../forms/Dropdown";
import { showErrorToast } from "../Toasts";
import { TaskPage } from ".";

const DESTINATION_TYPES = [
  { id: "project", name: "Project", testId: "move-task-destination-project" },
  { id: "space", name: "Space", testId: "move-task-destination-space" },
] as const;

export function MoveModal(props: TaskPage.ContentState) {
  const [isMoving, setIsMoving] = React.useState(false);
  const [destinationType, setDestinationType] = React.useState<TaskPage.MoveDestinationType>("project");
  const [project, setProject] = React.useState<ProjectField.Project | null>(null);
  const [space, setSpace] = React.useState<SpaceField.Space | null>(null);

  React.useEffect(() => {
    if (!props.isMoveModalOpen) return;

    setDestinationType("project");
    setProject(null);
    setSpace(null);
  }, [props.isMoveModalOpen]);

  if (!props.onMoveTask || !props.projectSearch || !props.spaceSearch) {
    return null;
  }

  const destinationId = destinationType === "project" ? project?.id : space?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destinationId) return;

    setIsMoving(true);

    try {
      const moved = await props.onMoveTask?.({
        destinationType,
        destinationId,
      });

      if (moved !== false) {
        props.closeMoveModal();
      } else {
        showErrorToast("Failed to move task", "Please try again");
      }
    } catch {
      showErrorToast("Failed to move task", "Please try again");
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Modal isOpen={props.isMoveModalOpen} onClose={props.closeMoveModal} size="small" title="Move task">
      <form className="space-y-6" onSubmit={handleSubmit} data-test-id="move-task-modal">
        <div>
          <label className="font-bold text-sm mb-1.5 block">Destination type</label>
          <Dropdown
            testId="move-task-destination-type"
            items={DESTINATION_TYPES.map((item) => ({ ...item }))}
            value={destinationType}
            onSelect={(item) => setDestinationType(item.id as TaskPage.MoveDestinationType)}
          />
        </div>

        <div>
          <label className="font-bold text-sm mb-1.5 block">
            {destinationType === "project" ? "Select destination project" : "Select destination space"}
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
              setSpace={setSpace}
              search={props.spaceSearch}
              variant="form-field"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <PrimaryButton
            size="sm"
            type="submit"
            loading={isMoving}
            disabled={isMoving || !destinationId}
            testId="confirm-move-task"
          >
            Move
          </PrimaryButton>
          <SecondaryButton size="sm" onClick={props.closeMoveModal} testId="cancel-move-task">
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}
