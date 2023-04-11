import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
        <h1 className="text-2xl font-bold mb-4">{t("forms.group_add_title")}</h1>

        <FormTextInput
          ref={nameInput}
          id="name"
          label={t("forms.group_name_label")}
          placeholder={t("forms.group_name_placeholder")!}
        />
      </Form>
    </>
  )
}
