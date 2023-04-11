import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        <h1 className="text-2xl font-bold mb-4">{t("forms.kpi_add_title")}</h1>

        <div className="flex flex-col gap-4">
          <FormTextInput ref={nameInput} id="name" label={t("forms.kpi_name_label")} placeholder={t("forms.kpi_name_placeholder")!} />
          <FormTextArea ref={descriptionInput} id="description" label={t("forms.kpi_description_label")} placeholder={t("forms.kpi_description_placeholder")!} />

          <FormSelect ref={unitInput} id="unit" label={t("forms.kpi_unit_label")}>
            <option value="percentage">{t("forms.kpi_unit_percentage")}</option>
            <option value="currency">{t("forms.kpi_unit_currency")}</option>
          </FormSelect>

          <FormTextInput ref={targetInput} id="target" label={t("forms.kpi_target_label")} placeholder={t("forms.kpi_target_placeholder")!} />
          <FormSelect ref={targetDirectionInput} id="targetDirection" label={t("forms.kpi_target_direction_label")}>
            <option value="above">{t("forms.kpi_target_direction_above")}</option>
            <option value="below">{t("forms.kpi_target_direction_below")}</option>
          </FormSelect>

          <FormTextInput ref={warningThresholdInput} id="warningThreshold" label={t("forms.kpi_warning_threshold_label")} placeholder={t("forms.kpi_warning_threshold_placeholder")!} />
          <FormSelect ref={warningDirectionInput} id="warningDirection" label={t("forms.kpi_warning_direction_label")}>
            <option value="above">{t("forms.kpi_target_direction_above")}</option>
            <option value="below">{t("forms.kpi_target_direction_below")}</option>
          </FormSelect>

          <FormTextInput ref={dangerThresholdInput} id="dangerThreshold" label={t("forms.kpi_danger_threshold_label")} placeholder={t("forms.kpi_danger_threshold_placeholder")!} />
          <FormSelect ref={dangerDirectionInput} id="dangerDirection" label={t("forms.kpi_danger_direction_label")}>
            <option value="above">{t("forms.kpi_target_direction_above")}</option>
            <option value="below">{t("forms.kpi_target_direction_below")}</option>
          </FormSelect>
        </div>
      </Form>
    </>
  )
}
