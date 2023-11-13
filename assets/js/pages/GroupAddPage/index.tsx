import React from "react";

import { useNavigate } from "react-router-dom";

import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/graphql/Companies";
import * as Icons from "@tabler/icons-react";
import * as Forms from "../../components/Form";
import * as Groups from "@/graphql/Groups";

import client from "@/graphql/client";

interface LoaderData {
  company: Companies.Company;
}

export async function loader(): Promise<LoaderData> {
  const companyData = await client.query({
    query: Companies.GET_COMPANY,
    variables: { id: Companies.companyID() },
    fetchPolicy: "network-only",
  });

  return { company: companyData.data.company };
}

export function Page() {
  const [{ company }] = Paper.useLoadedData() as [LoaderData, () => void];

  return (
    <Paper.Root size="small">
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/spaces`}>
          <Icons.IconUsers size={16} stroke={3} />
          Groups
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body minHeight="300px">
        <h1 className="mb-8 font-bold text-2xl">New Group in {company.name}</h1>

        <Form />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form() {
  let navigate = useNavigate();

  const [createGroup, { loading }] = Groups.useCreateGroup();

  const [name, setName] = React.useState("");
  const [mission, setMission] = React.useState("");

  const onSubmit = async () => {
    const res = await createGroup({
      variables: {
        name: name,
        mission: mission,
      },
    });

    navigate(`/spaces/${res.data.createGroup.id}`);
  };

  const onCancel = () => navigate("/");

  const isValid = name.length > 0 && mission.length > 0;

  return (
    <Forms.Form isValid={isValid} onSubmit={onSubmit} onCancel={onCancel} loading={loading}>
      <Forms.TextInput label="Group Name" value={name} onChange={setName} placeholder="ex. Marketing" />
      <Forms.TextInput
        label="Mission"
        value={mission}
        onChange={setMission}
        placeholder="ex. Create product awareness and bring new leads"
      />

      <Forms.SubmitArea>
        <Forms.SubmitButton>Create Group</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
