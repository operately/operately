import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as ProjectContributors from "@/models/projectContributors";
import * as Projects from "@/models/projects";

import ContributorAvatar from "@/components/ContributorAvatar";

import { PERMISSIONS_LIST } from "@/features/Permissions";
import { ContributorSearch, RemoveButton, SaveButton, CancelButton, ResponsibilityInput, PermissionsInput } from "./FormElements";
import { createTestId } from "@/utils/testid";


interface Props {
  project: Projects.Project;
  contributor: ProjectContributors.ProjectContributor;
  refetch: any;
}

export default function ContributorItem({ project, contributor, refetch }: Props) {
  return (
    <div data-test-id={`contributor-${contributor?.person.id}`}>
      <ContributorItemContent contributor={contributor} project={project} refetch={refetch} />
    </div>
  );
}

function ContributorItemContent({ contributor, project, refetch }: Props) {
  const [state, setState] = React.useState<"view" | "edit">("view");

  const activateEdit = () => setState("edit");
  const deactivateEdit = () => setState("view");
  const onChange = async () => {
    await refetch();
    deactivateEdit();
  };

  if (state === "view") {
    return <Assignment project={project} contributor={contributor} onEdit={activateEdit} />;
  }

  if (state === "edit") {
    return (
      <EditAssignment
        project={project}
        contributor={contributor}
        onSave={onChange}
        onRemove={onChange}
        onClose={deactivateEdit}
      />
    );
  }

  throw new Error("Invalid state");
}

function Assignment({ project, contributor, onEdit }) {
  return (
    <ViewState
      project={project}
      avatar={<ContributorAvatar contributor={contributor} />}
      name={contributor.person.fullName}
      responsibility={ProjectContributors.responsibility(contributor, contributor.role)}
      onEdit={onEdit}
    />
  );
}

function ViewState({ project, avatar, name, responsibility, onEdit }) {
  const editTestId = createTestId("edit-contributor", name);

  return (
    <div className="flex items-center justify-between border-b border-stroke-base py-2 fadeIn group">
      <div className="flex items-center gap-2">
        {avatar}

        <div className="flex flex-col flex-1">
          <div className="font-bold">{name}</div>
          <div className="text-sm font-medium flex items-center gap-1">{responsibility}</div>
        </div>
      </div>

      {project.permissions.canEditContributors && (
        <div className="shrink-0">
          <div
            className="rounded-full p-2 hover:bg-surface-dimmed transition-colors"
            onClick={onEdit}
            data-test-id={editTestId}
          >
            <Icons.IconPencil
              size={20}
              className="cursor-pointer text-content-subtle hover:text-content-accent transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EditAssignment({ contributor, project, onSave, onRemove, onClose }) {
  const [update, _s1] = Projects.useUpdateProjectContributor();
  const [remove, { loading }] = Projects.useRemoveProjectContributor();

  const responsibility = ProjectContributors.responsibility(contributor, contributor.role);

  const [permissions, setPermissions] = React.useState(PERMISSIONS_LIST.find(p => p.value === contributor.accessLevel));
  const [personID, setPersonID] = React.useState<any>(contributor.person.id);
  const [newResp, setNewResp] = React.useState(responsibility);

  const disabled = !personID || !newResp;

  const handleSave = async () => {
    await update({
      contribId: contributor.id,
      personId: personID,
      responsibility: newResp,
    });

    onSave();
  };

  const handleRemove = async () => {
    await remove({ contribId: contributor.id });
    onRemove();
  };

  return (
    <div className="bg-surface-dimmed border-y border-surface-outline -mx-12 px-12 py-8">
      <ContributorSearch
        defaultValue={contributor.person}
        projectID={project.id}
        title={contributor.role}
        onSelect={setPersonID}
      />

      {ProjectContributors.isResponsibilityEditable(contributor.role) && (
        <ResponsibilityInput value={newResp} onChange={setNewResp} />
      )}

      {ProjectContributors.isPermissionsEditable(contributor.role) && (
        <PermissionsInput value={permissions} onChange={setPermissions} />
      )}

      <div className="flex justify-between mt-8">
        <div className="flex gap-2">
          <SaveButton disabled={disabled} onClick={handleSave} />
          <CancelButton onClick={onClose} />
        </div>

        {ProjectContributors.isResponsibilityRemovable(contributor.role) && (
          <RemoveButton onClick={handleRemove} loading={loading} />
        )}
      </div>
    </div>
  );
}
