import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
        <h1 className="text-2xl font-bold mb-4">{t("forms.project_add_title")}</h1>

        <div className="flex flex-col gap-4">
          <FormTextInput
            ref={nameInput}
            id="name"
            label={t("forms.project_name_label")}
            placeholder={t("forms.project_name_placeholder")!}
          />

          <FormTextArea
            ref={descriptionInput}
            id="description"
            label={t("forms.project_description_label")}
            placeholder={t("forms.project_description_placeholder")!}
          />
        </div>
      </Form>
    </>
  )
}
