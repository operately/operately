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

  let navigate = useNavigate();
  let nameInput = React.useRef<HTMLInputElement>(null);

  const [createGroup] = useMutation(CREATE_GROUP);

  const onSubmit = async () => {
    await createGroup({ variables: { name: nameInput.current?.value } });

    navigate("/groups");
  };

  const onCancel = () => {
    navigate("/groups");
  };

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

function Form() {}

// <>
//   <Forms.Form isValid={true} onSubmit={onSubmit} onCancel={onCancel}>
//     <h1 className="text-2xl font-bold mb-4">{t("forms.group_add_title")}</h1>

//     <FormTextInput
//       ref={nameInput}
//       id="name"
//       label={t("forms.group_name_label")}
//       placeholder={t("forms.group_name_placeholder")!}
//     />
//   </Forms.Form>
// </>
// );
