import React from "react";

import { useNavigate } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";

import Form from "../../components/Form";
import FormTextInput from "../../components/FormTextInput";
import FormTextArea from "../../components/FormTextArea";

const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String) {
    createProject(name: $name, description: $description) {
      id
      name
    }
  }
`;

export default function ProjectAddPage() {
  let navigate = useNavigate();
  let nameInput = React.useRef<HTMLInputElement>(null);
  let descriptionInput = React.useRef<HTMLTextAreaElement>(null);

  const [createProject] = useMutation(CREATE_PROJECT);

  const onSubmit = async () => {
    await createProject({
      variables: {
        name: nameInput.current?.value,
        description: descriptionInput.current?.value
      }
    });

    navigate("/projects");
  };

  const onCancel = () => {
    navigate("/projects");
  };

  return (
    <>
      <Form onSubmit={onSubmit} onCancel={onCancel}>
        <h1 className="text-2xl font-bold mb-4">Add Project</h1>

        <FormTextInput ref={nameInput} id="name" label="Name" placeholder="ex. Company Website" />
        <FormTextArea ref={descriptionInput} id="description" label="Description" placeholder="Describe the details of the project" />
      </Form>
    </>
  )
}
