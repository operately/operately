import React from "react";

import { useNavigate } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";

import * as Forms from "../../components/Form";
import FormTextInput from "../../components/FormTextInput";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Companies from "@/graphql/Companies";

import client from "@/graphql/client";

const CREATE_GROUP = gql`
  mutation CreateGroup($name: String!) {
    createGroup(name: $name) {
      id
      name
    }
  }
`;

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
        <Paper.NavItem linkTo={`/projects`}>
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

  const [name, setName] = React.useState("");
  const [mission, setMission] = React.useState("");

  const [createGroup] = useMutation(CREATE_GROUP);

  const onSubmit = async () => {
    const res = await createGroup({ variables: { name: name } });

    navigate(`/groups/${res.data.createGroup.id}`);
  };

  const onCancel = () => navigate("/groups");

  const isValid = name.length > 0 && mission.length > 0;

  return (
    <Forms.Form isValid={isValid} onSubmit={onSubmit} onCancel={onCancel}>
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
