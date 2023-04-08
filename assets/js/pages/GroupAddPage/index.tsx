import React from "react";

import { useNavigate } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";
import Form from "../../components/Form";

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

  const onSubmit = () => {
    createGroup({ variables: { name: nameInput.current?.value } });
    navigate("/groups");
  };

  const onCancel = () => {
    navigate("/groups");
  };

  return (
    <>
      <Form onSubmit={onSubmit} onCancel={onCancel}>
        <input ref={nameInput} type="text" className="" />
      </Form>
    </>
  )
}
