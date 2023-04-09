import React from "react";

import { useNavigate } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";

import Form from "../../components/Form";
import FormTextInput from "../../components/FormTextInput";

const CREATE_GROUP = gql`
  mutation CreateGroup($name: String!) {
    createGroup(name: $name) {
      id
      name
    }
  }
`;

export default function GroupAddPage() {
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
    <>
      <Form onSubmit={onSubmit} onCancel={onCancel}>
        <h1 className="text-2xl font-bold mb-4">Add Group</h1>

        <FormTextInput ref={nameInput} id="name" label="Name" placeholder="ex. Marketing" />
      </Form>
    </>
  )
}
