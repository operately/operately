import * as React from "react";

import { WorkMapPage } from "turboui";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
import { useSpaceSearch } from "../../models/spaces";
import { convertToWorkMapItems, useWorkMapItems } from "../../models/workMap";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export function Page() {
  const paths = usePaths();

  const { workMap, space, projectTemplatesEnabled, templates } = useLoadedData().data;
  const hideCompanyAccessInQuickAdd = Boolean(space.privateSpace);

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

  return (
    <WorkMapPage
      title="Work Map"
      addingEnabled={space.permissions?.canEdit}
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
      projectTemplatesEnabled={projectTemplatesEnabled}
      projectTemplates={projectTemplates}
    />
  );
}
