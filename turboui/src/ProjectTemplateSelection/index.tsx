import * as React from "react";

import * as Forms from "../Forms";

export namespace ProjectTemplateSelection {
  export interface Template {
    id: string;
    name: string;
    spaceId: string;
  }

  export interface Props {
    spaceId?: string | null;
    templates: Template[];
  }
}

export function ProjectTemplateSelection({ spaceId, templates }: ProjectTemplateSelection.Props) {
  const [templateId, setTemplateId] = Forms.useFieldValue<string>("template");
  const [, setStartDate] = Forms.useFieldValue<string>("startDate");
  const compatibleTemplates = React.useMemo(
    () => templates.filter((template) => template.spaceId === spaceId),
    [spaceId, templates],
  );

  React.useEffect(() => {
    if (templateId && !compatibleTemplates.some((template) => template.id === templateId)) {
      setTemplateId("");
      setStartDate("");
    }
  }, [compatibleTemplates, setStartDate, setTemplateId, templateId]);

  if (!spaceId) return null;

  return (
    <>
      <Forms.SelectBox
        label="Template"
        field="template"
        options={[
          { value: "", label: "No template" },
          ...compatibleTemplates.map((template) => ({ value: template.id, label: template.name })),
        ]}
      />
      {templateId ? (
        <Forms.DateInput
          label="Project start date"
          field="startDate"
          required
          requiredMessage="Select a project start date."
        />
      ) : null}
    </>
  );
}
