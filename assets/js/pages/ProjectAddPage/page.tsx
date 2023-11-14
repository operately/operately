import React from "react";

import { useNavigate } from "react-router-dom";

import * as Paper from "@/components/PaperContainer";

import PeopleSearch from "@/components/PeopleSearch";

import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";
import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";

export function Page() {
  const { company, me } = useLoadedData();

  return (
    <Pages.Page title="New Project">
      <Paper.Root size="small">
        <h1 className="mb-4 font-bold text-3xl text-center">Create a new project</h1>

        <Paper.Body minHeight="300px">
          <Form company={company} me={me} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ company, me }) {
  const { spaceID } = useLoadedData();
  const navigate = useNavigate();

  const [projectName, setProjectName] = React.useState("");
  const [projectChampion, setProjectChampion] = React.useState<string>(me.id);
  const [visibility, setVisibility] = React.useState<string | null>("everyone");
  const [creatorRole, setCreatorRole] = React.useState<{ value: string; label: string } | null>(null);

  const [add, { loading }] = Projects.useCreateProject({
    onCompleted: (data: any) => navigate(`/projects/${data?.createProject?.id}`),
  });

  const handleSubmit = () => {
    add({
      variables: {
        input: {
          name: projectName,
          championId: projectChampion,
          visibility: visibility,
          creatorRole: creatorRole?.value,
          spaceId: spaceID,
        },
      },
    });
  };

  const handleCancel = () => navigate(`/spaces/${spaceID}`);

  const isValid =
    projectName.length > 0 &&
    projectChampion !== null &&
    visibility !== null &&
    (projectChampion === me.id || (creatorRole !== null && creatorRole.value.length > 0));

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid} onCancel={handleCancel}>
      <div className="flex flex-col gap-6">
        <Forms.TextInput
          label="Name"
          value={projectName}
          onChange={setProjectName}
          placeholder="e.g. HR System Update"
          data-test-id="project-name-input"
        />

        <ContributorSearch title="Champion" onSelect={setProjectChampion} defaultValue={me} />

        {projectChampion !== me.id && (
          <Forms.SelectBox
            label="What is your role on this project?"
            value={creatorRole}
            onChange={setCreatorRole}
            allowEnteringNewValues
            options={[
              { value: "Reviewer", label: "Reviewer" },
              { value: "Project Manager", label: "Project Manager" },
              { value: "Product Manager", label: "Product Manager" },
              { value: "Designer", label: "Designer" },
              { value: "Developer", label: "Developer" },
              { value: "QA", label: "QA" },
            ]}
            defaultValue="Reviewer"
            data-test-id="your-role-input"
          />
        )}

        <Forms.RadioGroupWithLabel
          label="Who can see this project?"
          name="visibility"
          defaultValue="everyone"
          onChange={(v: string | null) => setVisibility(v)}
        >
          <Forms.RadioWithExplanation
            label="All-Access"
            explanation={"Anyone from " + company.name + " can see this project"}
            value="everyone"
          />

          <Forms.RadioWithExplanation
            label={"Invite-only"}
            explanation={"Only people you invite can see this project"}
            value="invite"
            data-test-id="invite-only"
          />
        </Forms.RadioGroupWithLabel>
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save">Create Project</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}

function ContributorSearch({ title, onSelect, defaultValue }) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-bold mb-1 block">{title}</label>
      <div className="flex-1">
        <PeopleSearch
          onChange={(option) => onSelect(option.value)}
          defaultValue={defaultValue}
          placeholder="Search person by name or title..."
          loader={loader}
        />
      </div>
    </div>
  );
}
