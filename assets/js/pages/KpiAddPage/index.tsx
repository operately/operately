import React from "react";

import { useNavigate } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";

import Form from "../../components/Form";
import FormTextInput from "../../components/FormTextInput";
import FormTextArea from "../../components/FormTextArea";
import FormSelect from "../../components/FormSelect";

const CREATE_KPI = gql`
  mutation CreateKpi($input: CreateKpiInput!) {
    createKpi(input: $input) {
      id
      name
    }
  }
`;

function asInt(value: string | undefined) {
  if (!value) {
    return null;
  }

  return parseInt(value);
}

export default function KpiAddPage() {
  let navigate = useNavigate();

  let nameInput = React.useRef<HTMLInputElement>(null);
  let descriptionInput = React.useRef<HTMLTextAreaElement>(null);
  let unitInput = React.useRef<HTMLSelectElement>(null);
  let targetInput = React.useRef<HTMLInputElement>(null);
  let targetDirectionInput = React.useRef<HTMLSelectElement>(null);
  let warningThresholdInput = React.useRef<HTMLInputElement>(null);
  let dangerThresholdInput = React.useRef<HTMLInputElement>(null);
  let warningDirectionInput = React.useRef<HTMLSelectElement>(null);
  let dangerDirectionInput = React.useRef<HTMLSelectElement>(null);

  const [createKpi] = useMutation(CREATE_KPI);

  const onSubmit = async () => {
    await createKpi({
      variables: {
        input : {
          name: nameInput.current?.value,
          description: descriptionInput.current?.value,
          unit: unitInput.current?.value,
          target: asInt(targetInput.current?.value),
          targetDirection: targetDirectionInput.current?.value,
          warningThreshold: asInt(warningThresholdInput.current?.value),
          warningDirection: warningDirectionInput.current?.value,
          dangerThreshold: asInt(dangerThresholdInput.current?.value),
          dangerDirection: dangerDirectionInput.current?.value,
        }
      }
    });

    navigate("/kpis");
  };

  const onCancel = () => {
    navigate("/kpis");
  };

  return (
    <>
      <Form onSubmit={onSubmit} onCancel={onCancel}>
        <h1 className="text-2xl font-bold mb-4">Add Kpi</h1>

        <FormTextInput ref={nameInput} id="name" label="Name" placeholder="ex. Company Website" />
        <FormTextArea ref={descriptionInput} id="description" label="Description" placeholder="Describe the details of the kpi" />

        <FormSelect ref={unitInput} id="unit" label="Unit">
          <option value="percentage">percentage</option>
          <option value="currency">currency</option>
        </FormSelect>

        <FormTextInput ref={targetInput} id="target" label="Target" />
        <FormSelect ref={targetDirectionInput} id="targetDirection" label="Target direction">
          <option value="above">above</option>
          <option value="below">below</option>
        </FormSelect>

        <FormTextInput ref={warningThresholdInput} id="warningThreshold" label="Warning threshold" />
        <FormSelect ref={warningDirectionInput} id="warningDirection" label="Warning direction">
          <option value="above">above</option>
          <option value="below">below</option>
        </FormSelect>

        <FormTextInput ref={dangerThresholdInput} id="dangerThreshold" label="Danger threshold" />
        <FormSelect ref={dangerDirectionInput} id="dangerDirection" label="Danger direction">
          <option value="above">above</option>
          <option value="below">below</option>
        </FormSelect>
      </Form>
    </>
  )
}
