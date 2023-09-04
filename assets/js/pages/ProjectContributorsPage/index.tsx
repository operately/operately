import React from "react";

import { useParams } from "react-router-dom";
import { useProject } from "@/graphql/Projects";
import { Project } from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";

import { ContributorSearch, ResponsibilityInput, CancelButton, AddContribButton } from "./FormElements";
import ContributorItem from "./ContributorItem";
import Button from "@/components/Button";

import * as Projects from "@/graphql/Projects";
import * as Contributors from "@/graphql/Projects/contributors";
import * as Paper from "@/components/PaperContainer";

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
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${projectId}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Title project={project} />
        <ContributorList project={project} refetch={refetch} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Title({ project }: { project: Project }) {
  const [addColabActive, setAddColabActive] = React.useState(false);

  const activateAddColab = () => setAddColabActive(true);
  const deactivateAddColab = () => setAddColabActive(false);

  const showAddButton = project.permissions.canEditContributors && !addColabActive;

  return (
    <div className="rounded-t-[20px] pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Contributors</div>
          <div className="text-medium">People who are contributing to this project and their responsibilities.</div>
        </div>

        {showAddButton && <AddButton onClick={activateAddColab} />}
      </div>

      {addColabActive && <AddContribForm close={deactivateAddColab} projectID={project.id} />}
    </div>
  );
}

function AddContribForm({ close, projectID }) {
  const [addColab, _s] = Projects.useAddProjectContributorMutation(projectID);

  const [personID, setPersonID] = React.useState<any>(null);
  const [responsibility, setResponsibility] = React.useState("");

  const disabled = !personID || !responsibility;

  const handleSubmit = async () => {
    await addColab(personID, responsibility);
    close();
  };

  return (
    <div className="bg-shade-1 border-y border-shade-1 -mx-12 px-12 mt-4 py-8">
      <ContributorSearch title="Contributor" projectID={projectID} onSelect={setPersonID} />

      <ResponsibilityInput value={responsibility} onChange={setResponsibility} />

      <div className="flex mt-8 gap-2">
        <AddContribButton onClick={handleSubmit} disabled={disabled} />
        <CancelButton onClick={close} />
      </div>
    </div>
  );
}

function AddButton({ onClick }) {
  return (
    <Button variant="success" onClick={onClick} data-test-id="add-contributor-button">
      <Icons.IconPlus size={20} />
      Add Contributor
    </Button>
  );
}

function ContributorList({ project, refetch }: { project: Project; refetch: any }) {
  const { champion, reviewer, contributors } = Contributors.splitByRole(project.contributors);

  return (
    <div className="flex flex-col">
      <ContributorItem contributor={champion} role="champion" project={project} refetch={refetch} />

      <ContributorItem contributor={reviewer} role="reviewer" project={project} refetch={refetch} />

      {contributors.map((c) => (
        <ContributorItem key={c.id} contributor={c} role="contributor" project={project} refetch={refetch} />
      ))}
    </div>
  );
}
