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
        <h1 className="text-2xl font-bold mb-4">Add Group</h1>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name</label>
        <input ref={nameInput} type="text" className="border border-gray-200 rounded w-full p-2" id="name" placeholder="ex. Marketing" />
      </Form>
    </>
  )
}
