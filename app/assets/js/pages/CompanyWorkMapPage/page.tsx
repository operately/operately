import * as React from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import * as Companies from "@/models/companies";
import * as Spaces from "@/models/spaces";
import { useSpaceSearch } from "@/models/spaces";
import { useNavigate } from "react-router";
import { WorkMapPage } from "turboui";
import { convertToWorkMapItems, useWorkMapItems } from "../../models/workMap";
import { usePaths } from "../../routes/paths";
import { finishFirstItemOnboarding } from "./finishFirstItemOnboarding";
import { useLoadedData } from "./loader";

export function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const me = useMe();
  const { workMap, company, spacesCount } = useLoadedData().data;

  const title = `${company.name} Work Map`;

  const initialFirstProjectState = !company.setupCompleted && workMap.length === 0;
  const [items, addItem] = useWorkMapItems(workMap, {
    projectChampionId: initialFirstProjectState ? me?.id : undefined,
  });
  const spaceSearch = useSpaceSearch({ accessLevel: "edit_access" });
  const canAddItem = spacesCount > 0;
  const formattedTimePreferences = useFormattedTimePreferences();
  const firstProjectStateVisible = initialFirstProjectState && canAddItem;
  const visibleItems = firstProjectStateVisible ? workMap : items;

  const handleItemCreated = React.useCallback(
    (type: "goal" | "project", id: string) => {
      finishFirstItemOnboarding({
        navigateToItem: () => navigate(type === "project" ? paths.projectPath(id) : paths.goalPath(id)),
        markSetupComplete: () => Companies.completeCompanySetup({ spaces: [] }),
        reportError: (error) => console.error("Failed to mark company setup as complete:", error),
      });
    },
    [navigate, paths],
  );

  return (
    <WorkMapPage
      title={title}
      items={convertToWorkMapItems(paths, visibleItems)}
      addItem={addItem}
      spaceSearch={spaceSearch}
      addingEnabled={canAddItem}
      addItemDefaultSpace={company.generalSpace && Spaces.parseSpaceForTurboUI(paths, company.generalSpace)}
      columnOptions={{ hideProject: true }}
      formattedTimePreferences={formattedTimePreferences}
      emptyStateVariant={firstProjectStateVisible ? "first-project" : "standard"}
      onItemCreated={firstProjectStateVisible ? handleItemCreated : undefined}
    />
  );
}
