import React from "react";

import * as Icons from "@tabler/icons-react";

import ContributorAvatar, { ChampionPlaceholder, ReviewerPlaceholder } from "@/components/ContributorAvatar";

import * as Contributors from "@/graphql/Projects/contributors";
import * as Projects from "@/graphql/Projects";

import { ContributorSearch, RemoveButton, SaveButton, CancelButton, ResponsibilityInput } from "./FormElements";

export default function ContributorItem({
  contributor = undefined,
  role,
  project,
  refetch,
}: {
  contributor: Contributors.Contributor | undefined;
  role: Contributors.ContributorRole;
  project: Projects.Project;
  refetch: any;
}) {
  const [state, setState] = React.useState<"view" | "edit">("view");

  const activateEdit = () => setState("edit");
  const deactivateEdit = () => setState("view");
  const onChange = async () => {
    await refetch();
    deactivateEdit();
  };

  if (state === "view") {
    if (contributor) {
      return <Assignment project={project} contributor={contributor} onEdit={activateEdit} />;
    } else {
      return <Placeholder project={project} role={role} onEdit={activateEdit} />;
    }
  }

  if (state === "edit") {
    if (contributor) {
      return (
        <EditAssignment
          project={project}
          contributor={contributor}
          onSave={onChange}
          onRemove={onChange}
          onClose={deactivateEdit}
        />
      );
    } else {
      return <ChooseAssignment role={role} projectId={project.id} onSave={onChange} onClose={deactivateEdit} />;
    }
  }

  throw new Error("Invalid state");
}

function Assignment({ project, contributor, onEdit }) {
  return (
    <ViewState
      project={project}
      avatar={<ContributorAvatar contributor={contributor} />}
      name={contributor.person.fullName}
      responsibility={Contributors.responsibility(contributor, contributor.role)}
      onEdit={onEdit}
    />
  );
}

function Placeholder({ project, role, onEdit }) {
  if (role !== "champion" && role !== "reviewer") {
    throw new Error("Only champion and reviewer roles are supported for ContributorItemPlaceholder");
  }

  let avatar: React.ReactNode = null;
  let responsibility: string | null = null;
  let name = `No ${role}`;

  if (role === "champion") {
    avatar = <ChampionPlaceholder />;
    responsibility = Contributors.CHAMPION_RESPONSIBILITY;
  }

  if (role === "reviewer") {
    avatar = <ReviewerPlaceholder />;
    responsibility = Contributors.REVIEWER_RESPONSIBILITY;
  }

  return <ViewState project={project} avatar={avatar} name={name} responsibility={responsibility} onEdit={onEdit} />;
}

function ViewState({ project, avatar, name, responsibility, onEdit }) {
  return (
    <div className="flex items-center justify-between border-b border-shade-1 pb-2.5 mb-2.5 fadeIn group">
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
            className="rounded-full p-2 hover:bg-shade-2 transition-colors opacity-0 group-hover:opacity-100"
            onClick={onEdit}
          >
            <Icons.IconPencil size={20} className="cursor-pointer text-white-2 hover:text-white-1 transition-colors" />
          </div>
        </div>
      )}
    </div>
  );
}

function EditAssignment({ contributor, project, onSave, onRemove, onClose }) {
  const [update, _s1] = Projects.useUpdateProjectContributorMutation(contributor.id);
  const [remove, _s2] = Projects.useRemoveProjectContributorMutation(contributor.id);

  const responsibility = Contributors.responsibility(contributor, contributor.role);

  const [personID, setPersonID] = React.useState<any>(contributor.person.id);
  const [newResp, setNewResp] = React.useState(responsibility);

  const disabled = !personID || !newResp;

  const handleSave = async () => {
    await update(personID, newResp);
    onSave();
  };

  const handleRemove = async () => {
    await remove();
    onRemove();
  };

  return (
    <div className="bg-shade-1 border-y border-shade-1 -mx-12 px-12 py-8 -mt-2.5 mb-2.5">
      <ContributorSearch
        defaultValue={contributor.person}
        projectID={project.id}
        title={contributor.role}
        onSelect={setPersonID}
      />

      {Contributors.isResponsibilityEditable(contributor.role) && (
        <ResponsibilityInput value={newResp} onChange={setNewResp} />
      )}

      <div className="flex justify-between mt-8">
        <div className="flex gap-2">
          <SaveButton disabled={disabled} onClick={handleSave} />
          <CancelButton onClick={onClose} />
        </div>

        {Contributors.isResponsibilityRemovable(contributor) && <RemoveButton onClick={handleRemove} />}
      </div>
    </div>
  );
}

function ChooseAssignment({ role, projectId, onSave, onClose }) {
  if (role !== "champion" && role !== "reviewer") {
    throw new Error("Only champion and reviewer roles are supported for ContributorItemPlaceholder");
  }

  const [add, _s1] = Projects.useAddProjectContributorMutation(projectId);
  const [personID, setPersonID] = React.useState<any>(null);

  const disabled = !personID;

  const handleSave = async () => {
    await add(personID, " ", role);
    onSave();
  };

  return (
    <div className="bg-shade-1 border-y border-shade-1 -mx-8 px-8 py-8 -mt-2.5 mb-2.5">
      <ContributorSearch projectID={projectId} title={role} onSelect={setPersonID} />

      <div className="flex justify-between mt-8">
        <div className="flex gap-2">
          <SaveButton disabled={disabled} onClick={handleSave} />
          <CancelButton onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
