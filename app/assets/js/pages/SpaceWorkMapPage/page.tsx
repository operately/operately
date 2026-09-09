import * as React from "react";

import { dismissToast, showErrorToast, WorkMapPage } from "turboui";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
import { useSpaceSearch } from "../../models/spaces";
import { convertToWorkMapItems, useWorkMapItems } from "../../models/workMap";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useNavigate } from "react-router";

export function Page() {
  const paths = usePaths();
  const navigate = useNavigate();

  const { data, creationData } = useLoadedData();
  const { workMap, space, templates } = data;
  const hideCompanyAccessInQuickAdd = Boolean(space.privateSpace);
  const canAddItem = !creationData.isLoading && !creationData.error && Boolean(space.permissions?.canEdit);

  const creationFailed = Boolean(creationData.error);
  const retryCreation = React.useRef(creationData.retry);

  React.useEffect(() => {
    retryCreation.current = creationData.retry;
  }, [creationData.retry]);

  React.useEffect(() => {
    if (!creationFailed) return;

    const id = showErrorToast("Couldn't load options for adding goals and projects.", "Try loading them again.", {
      id: `space-work-map-creation-${space.id}`,
      duration: Infinity,
      action: {
        label: "Try again",
        onClick: () => {
          void retryCreation.current();
        },
      },
    });
    return () => dismissToast(id);
  }, [space.id, creationFailed]);

  const [items, addItem] = useWorkMapItems(workMap);
  const spaceSearch = useSpaceSearch();
  const formattedTimePreferences = useFormattedTimePreferences();

  const projectTemplates = React.useMemo(
    () =>
      templates.map((template) => ({
        id: template.id,
        name: template.name,
        spaceId: template.space.id,
        inactivePeopleSummary: template.inactivePeopleSummary,
        inactiveDiscussionCount: template.inactiveDiscussionCount,
      })),
    [templates],
  );

  const handleCreateProjectTemplate = React.useCallback(
    (spaceId: string) => navigate(paths.newProjectTemplatePath(spaceId)),
    [navigate, paths],
  );

  return (
    <WorkMapPage
      title="Work Map"
      addingEnabled={canAddItem}
      creationLoading={creationData.isLoading}
      creationError={creationFailed}
      items={convertToWorkMapItems(paths, items)}
      addItem={addItem}
      spaceSearch={spaceSearch}
      columnOptions={{ hideSpace: true, hideProject: true }}
      navigation={[{ to: paths.spacePath(space.id), label: space.name }]}
      hideCompanyAccessInQuickAdd={hideCompanyAccessInQuickAdd}
      formattedTimePreferences={formattedTimePreferences}
      addItemDefaultSpace={{
        id: space.id,
        name: space.name,
        link: paths.spacePath(space.id),
      }}
      projectTemplates={projectTemplates}
      onCreateProjectTemplate={handleCreateProjectTemplate}
    />
  );
}
