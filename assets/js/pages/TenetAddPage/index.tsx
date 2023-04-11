import React from "react";
import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";

import Form from "../../components/Form";
import FormTextInput from "../../components/FormTextInput";
import FormTextArea from "../../components/FormTextArea";

const CREATE_TENET = gql`
  mutation CreateTenet($name: String!, $description: String) {
    createTenet(name: $name, description: $description) {
      id
      name
    }
  }
`;

export default function TenetAddPage() {
  const { t } = useTranslation();
  let navigate = useNavigate();
  let nameInput = React.useRef<HTMLInputElement>(null);
  let descriptionInput = React.useRef<HTMLTextAreaElement>(null);

  const [createTenet] = useMutation(CREATE_TENET);

  const onSubmit = async () => {
    await createTenet({
      variables: {
        name: nameInput.current?.value,
        description: descriptionInput.current?.value
      }
    });

    navigate("/tenets");
  };

  const onCancel = () => {
    navigate("/tenets");
  };

  return (
    <>
      <Form onSubmit={onSubmit} onCancel={onCancel}>
        <h1 className="text-2xl font-bold mb-4">{t("forms.tenet_add_title")}</h1>

        <div className="flex flex-col gap-4">
          <FormTextInput
            ref={nameInput}
            id="name"
            label={t("forms.tenet_name_label")}
            placeholder={t("forms.tenet_name_placeholder")!}
          />

          <FormTextArea
            ref={descriptionInput}
            id="description"
            label={t("forms.tenet_description_label")}
            placeholder={t("forms.tenet_description_placeholder")!}
          />
        </div>
      </Form>
    </>
  )
}
