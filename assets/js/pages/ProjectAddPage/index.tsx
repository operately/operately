import React from "react";

import { useNavigate } from "react-router-dom";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import PeopleSearch from "@/components/PeopleSearch";
import Button from "@/components/Button";

import * as Companines from "@/graphql/Companies";
import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";

export function ProjectAddPage() {
  const { data, loading, error } = Companines.useCompany(window.companyID);

  if (loading) return <p>Loading...</p>;
  if (error) throw new Error(error.message);

  const company = data?.company;

  return (
    <Paper.Root size="small">
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects`}>
          <Icons.IconClipboardList size={16} />
          All Projects
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body minHeight="300px">
        <h1 className="mb-8 font-bold text-2xl">New Project in {company.name}</h1>

        <Form />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form() {
  const navigate = useNavigate();

  const [projectName, setProjectName] = React.useState("");
  const [projectChampion, setProjectChampion] = React.useState(null);

  const [add] = Projects.useAddProject({
    onCompleted: (data: any) => navigate(`/projects/${data?.createProject?.id}`),
  });

  const handleSubmit = () => {
    add({
      variables: {
        name: projectName,
        championId: projectChampion,
      },
    });
  };

  const isDisabled = () => {
    return !projectName || !projectChampion;
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <ProjectNameInput value={projectName} onChange={setProjectName} />
        <ContributorSearch title="Choose a Project Champion" onSelect={setProjectChampion} />
      </div>

      <div className="flex items-center gap-3 mt-12">
        <Button variant="success" onClick={handleSubmit} disabled={isDisabled()}>
          Create Project
        </Button>
        <Button variant="secondary" linkTo="/projects">
          Cancel
        </Button>
      </div>
    </>
  );
}

function ProjectNameInput({ value, onChange }) {
  return (
    <div>
      <label className="font-bold mb-1 block">Project Name</label>
      <div className="flex-1">
        <input
          className="w-full bg-shade-3 text-white-1 placeholder-white-2 border-none rounded-lg px-3"
          type="text"
          placeholder="ex. HR System Update"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function ContributorSearch({ title, onSelect }) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-bold mb-1 block">{title}</label>
      <div className="flex-1">
        <PeopleSearch
          onChange={(option) => onSelect(option.value)}
          placeholder="Search by name or title..."
          loader={loader}
        />
      </div>
    </div>
  );
}
