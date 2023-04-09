import React from "react";

import { useNavigate } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";
import Form from "../../components/Form";

const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String) {
    createProject(name: $name, description: $description) {
      id
      name
    }
  }
`;

const FormTextInput = React.forwardRef<HTMLInputElement>(({id, label, ...rest} : any, ref) => {
  return <>
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>{label}</label>
    <input {...rest} id={id} ref={ref} type="text" className="border border-gray-200 rounded w-full p-2" />
  </>;
});

const FormTextArea = React.forwardRef<HTMLTextAreaElement>(({id, label, ...rest} : any, ref) => {
  return <>
    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>Description</label>
    <textarea {...rest} id={id} ref={ref} className="border border-gray-200 rounded w-full p-2" />
  </>;
});

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
