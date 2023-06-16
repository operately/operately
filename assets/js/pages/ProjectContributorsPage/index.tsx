import React from "react";

import { useParams } from "react-router-dom";
import { useProject } from "@/graphql/Projects";
import { Link } from "react-router-dom";
import { Project } from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";

import PersonSearch from "./PersonSearch";
import * as Projects from "@/graphql/Projects";

export function ProjectContributorsPage() {
  const params = useParams();
  const projectId = params["project_id"];

  if (!projectId) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data, refetch } = useProject(projectId);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  const project = data.project;

  return (
    <div className="mt-24">
      <div className="flex justify-between items-center mb-4 mx-auto max-w-4xl">
        <BackToProject linkTo={`/projects/${projectId}`} />
      </div>

      <div
        className="mx-auto max-w-4xl relative bg-dark-2 rounded-[20px]"
        style={{ minHeight: "1000px" }}
      >
        <Title projectID={projectId} />
        <ContributorList project={project} refetch={refetch} />
      </div>
    </div>
  );
}

function Title({ projectID }) {
  const [addColabActive, setAddColabActive] = React.useState(false);

  const activateAddColab = () => setAddColabActive(true);
  const deactivateAddColab = () => setAddColabActive(false);

  return (
    <div className="rounded-t-[20px] p-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Contributors</div>
          <div className="text-medium">
            People who are contributing to this project and their
            responsibilities.
          </div>
        </div>

        {!addColabActive && <AddButton onClick={activateAddColab} />}
      </div>

      {addColabActive && (
        <AddContribForm close={deactivateAddColab} projectID={projectID} />
      )}
    </div>
  );
}

function AddContribForm({ close, projectID }) {
  const [addColab, _s] = Projects.useAddProjectContributorMutation(projectID);
  const loader = Projects.useProjectContributorCandidatesQuery(projectID);

  const [selectedPersonID, setSelectedPersonID] = React.useState<any>(null);
  const [responsibility, setResponsibility] = React.useState("");

  const disabled = !selectedPersonID || !responsibility;

  const handleSubmit = async () => {
    await addColab(selectedPersonID, responsibility);
    close();
  };

  return (
    <div className="bg-shade-1 border-y border-shade-1 -mx-8 px-8 mt-4 py-8">
      <div className="mb-6">
        <label className="font-bold mb-1 block">Contributor</label>
        <div className="flex-1">
          <PersonSearch
            onChange={(option) => setSelectedPersonID(option.value)}
            placeholder="Search by name or title..."
            loader={loader}
          />
        </div>
      </div>
      <div className="">
        <label className="font-bold mb-1 block">
          What are the responsibilities of this contributor?
        </label>
        <div className="flex-1">
          <input
            value={responsibility}
            onChange={(e) => setResponsibility(e.target.value)}
            className="w-full bg-shade-2 text-white-1 placeholder-white-2 border-none rounded-lg px-3"
            type="text"
            placeholder="ex. Responsible for the visual design of the project."
          />
        </div>
      </div>

      <div className="flex mt-8 gap-2">
        <Button variant="success" disabled={disabled} onClick={handleSubmit}>
          <Icons.IconPlus size={20} />
          Add Contributor
        </Button>
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddButton({ onClick }) {
  return (
    <Button variant="success" onClick={onClick}>
      <Icons.IconPlus size={20} />
      Add Contributor
    </Button>
  );
}

function BackToProject({ linkTo }) {
  return (
    <Link to={linkTo}>
      <div className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:bg-pink-400/10 px-3 py-1.5 text-sm flex items-center gap-2 mt-4">
        <Icons.IconArrowLeft size={20} />
        Back To Project
      </div>
    </Link>
  );
}

function ContributorList({ project, refetch }: { project: Project }) {
  return (
    <div className="flex flex-col px-8">
      <ContributorItem
        person={project.owner}
        responsibility={
          <>
            Champion &ndash; Responsible for the success of the project
            <Icons.IconCrown size={20} className="text-yellow-400" />
          </>
        }
        refetch={refetch}
      />

      <ContributorItem
        person={project.reviewer}
        responsibility={
          <>
            Reviewer &ndash; Responsible for reviewing and acknowledging
            progress
            <Icons.IconEyeCheck size={20} className="text-yellow-400" />
          </>
        }
        refetch={refetch}
      />

      {project.contributors.map((c) => (
        <ContributorItem
          key={c.id}
          person={c.person}
          responsibility={c.responsibility}
          projectId={project.id}
          contribId={c.id}
          refetch={refetch}
        />
      ))}
    </div>
  );
}

function ContributorItem({
  person,
  responsibility,
  projectId,
  contribId,
  refetch,
}) {
  const [state, setState] = React.useState<"view" | "edit">("view");

  const activateEdit = () => setState("edit");
  const deactivateEdit = () => setState("view");

  if (state === "view") {
    return (
      <ContributorItemViewState
        person={person}
        responsibility={responsibility}
        onEdit={activateEdit}
      />
    );
  } else {
    return (
      <ContributorItemEditState
        person={person}
        responsibility={responsibility}
        close={deactivateEdit}
        projectId={projectId}
        contribId={contribId}
        refetch={refetch}
      />
    );
  }
}

function ContributorItemViewState({ person, responsibility, onEdit }) {
  return (
    <div className="flex items-center justify-between border-b border-shade-1 pb-2.5 mb-2.5 fadeIn group">
      <div className="flex items-center gap-2">
        <div className="shrink-0">
          <Avatar person={person} />
        </div>
        <div className="flex flex-col flex-1">
          <div className="font-bold">{person.fullName}</div>
          <div className="text-sm font-medium flex items-center gap-1">
            {responsibility}
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <div
          className="rounded-full p-2 hover:bg-shade-2 transition-colors opacity-0 group-hover:opacity-100"
          onClick={onEdit}
        >
          <Icons.IconPencil
            size={20}
            className="cursor-pointer text-white-2 hover:text-white-1 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

function ContributorItemEditState({
  person,
  responsibility,
  close,
  projectId,
  contribId,
  refetch,
}) {
  const loader = Projects.useProjectContributorCandidatesQuery(projectId);

  const [update, _us] = Projects.useUpdateProjectContributorMutation(contribId);
  const [remove, _rs] = Projects.useRemoveProjectContributorMutation(contribId);

  const [personID, setPersonID] = React.useState<any>(person.id);
  const [newResp, setNewResp] = React.useState(responsibility);

  const disabled = !personID || !newResp;

  const handleSave = async () => {
    await update(personID, newResp);
    refetch();
    close();
  };

  const handleRemove = async () => {
    await remove();
    close();
    refetch();
  };

  return (
    <div className="bg-shade-1 border-y border-shade-1 -mx-8 px-8 py-8 -mt-2.5 mb-2.5">
      <div className="mb-6">
        <label className="font-bold mb-1 block">Contributor</label>
        <div className="flex-1">
          <PersonSearch
            onChange={(option) => setPersonID(option.value)}
            placeholder="Search by name or title..."
            loader={loader}
            defaultValue={person}
          />
        </div>
      </div>
      <div className="">
        <label className="font-bold mb-1 block">
          What are the responsibilities of this contributor?
        </label>
        <div className="flex-1">
          <input
            value={newResp}
            onChange={(e) => setNewResp(e.target.value)}
            className="w-full bg-shade-2 text-white-1 placeholder-white-2 border-none rounded-lg px-3"
            type="text"
            placeholder="ex. Responsible for the visual design of the project."
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <div className="flex gap-2">
          <Button variant="success" disabled={disabled} onClick={handleSave}>
            <Icons.IconCheck size={20} />
            Save
          </Button>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="danger" onClick={handleRemove}>
            <Icons.IconX size={20} />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
