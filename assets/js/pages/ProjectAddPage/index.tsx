import React from "react";

import { useNavigate } from "react-router-dom";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import PeopleSearch from "@/components/PeopleSearch";

import * as Companines from "@/graphql/Companies";
import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";
import * as Forms from "@/components/Form";

import { useDocumentTitle } from "@/layouts/header";
import client from "@/graphql/client";

export async function loader() {
  let company = await client.query({
    query: Companines.GET_COMPANY,
    variables: { id: Companines.companyID() },
    fetchPolicy: "network-only",
  });

  return {
    company: company.data.company,
  };
}

export function Page() {
  useDocumentTitle("New Project");
  const [{ company }] = Paper.useLoadedData() as [{ company: any }];

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

  const [add, { loading }] = Projects.useAddProject({
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

  const handleCancel = () => {
    navigate(`/projects`);
  };

  const isValid = projectName.length > 0 && projectChampion !== null;

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid} onCancel={handleCancel}>
      <div className="flex flex-col gap-6">
        <Forms.TextInput
          label="Project Name"
          value={projectName}
          onChange={setProjectName}
          placeholder="ex. HR System Update"
          data-test-id="project-name-input"
        />

        <ContributorSearch title="Choose a Project Champion" onSelect={setProjectChampion} />
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save">Create Project</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
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
