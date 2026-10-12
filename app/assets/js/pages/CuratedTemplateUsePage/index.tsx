import { loader, useLoadedData } from "./loader";
import { defaultDestination, todayInTimezone } from "./settings";
import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import Api, { CuratedTemplate, Space } from "@/api";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { useTimezone } from "@/contexts/TimezoneContext";
import { useInstantiateTemplate } from "@/models/curatedTemplates/curatedTemplateLifecycle";
import { CuratedTemplateUsePage, TemplateSettings } from "turboui";

function Page() {
  const { template, templateId, spaces } = useLoadedData();
  const { company } = useCompanyLoaderData();

  return (
    <CreationForm
      key={`${company.id}:${templateId}`}
      template={template}
      templateId={templateId}
      spaces={spaces}
      generalSpaceId={company.companySpaceId}
    />
  );
}

function CreationForm({
  template,
  templateId,
  spaces,
  generalSpaceId,
}: {
  template: CuratedTemplate;
  templateId: string;
  spaces: Space[];
  generalSpaceId?: string | null;
}) {
  const defaultSpaceId = defaultDestination(spaces, generalSpaceId);
  const [spaceId, setSpaceId] = React.useState(defaultSpaceId);
  const peopleOptions = useMemo(
    () => Api.people.getBindedQueryOptions({ resourseType: "space", resourseId: spaceId }),
    [spaceId],
  );
  const peopleQuery = useQuery({
    ...peopleOptions,
    enabled: !!spaceId,
  });
  const paths = usePaths();
  const navigate = useNavigate();
  const timezone = useTimezone();
  const [today] = React.useState(() => todayInTimezone(timezone));
  const create = useInstantiateTemplate();
  const onCreate = async (settings: TemplateSettings) => {
    const input = {
      ...settings,
      templateId,
      startDate: template.type === "kpi" ? undefined : settings.startDate,
    };
    const result = await create.mutateAsync(input);
    const destination =
      result.resourceType === "goal"
        ? paths.goalPath(result.resourceId)
        : result.resourceType === "project"
          ? paths.projectPath(result.resourceId)
          : paths.spaceKpiPath(result.spaceId, result.resourceId);
    navigate(destination);
  };

  return (
    <CuratedTemplateUsePage
      template={template}
      spaces={spaces}
      defaultSpaceId={defaultSpaceId}
      today={today}
      people={(peopleQuery.data?.people ?? []).filter((person) => !person.suspended)}
      peopleSpaceId={peopleQuery.isSuccess ? spaceId : null}
      peopleError={peopleQuery.isError}
      peopleLoading={peopleQuery.isFetching}
      onRetryPeople={() => {
        void peopleQuery.refetch();
      }}
      onSpaceChange={setSpaceId}
      onCreate={onCreate}
      onCancel={() => navigate(paths.homePath())}
      homePath={paths.homePath()}
    />
  );
}

export default { name: "CuratedTemplateUsePage", loader, Page } as PageModule;
