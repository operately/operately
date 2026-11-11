import { useSpaceToolManagement } from "./useSpaceToolManagement";
import type { ToolAction } from "turboui";
import type { TaskBoardSummary, ResourceHubSummary } from "@/api";
import axios from "axios";

import * as React from "react";

import * as Spaces from "@/models/spaces";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router";

import { SpaceToolsConfigurationPage, showErrorToast } from "turboui";
import { useTranslation } from "react-i18next";

import { loader, useLoadedData } from "./loader";

export default { name: "SpaceToolsConfigurationPage", loader, Page } as PageModule;

function Page() {
  const { spaceId, space, tools, boards, hubs } = useLoadedData();

  // The route ID stays stable when a background rename changes the returned space slug.
  return <ToolsForm key={spaceId} space={space} loadedTools={tools} boards={boards} hubs={hubs} />;
}

function ToolsForm({
  space,
  loadedTools,
  boards,
  hubs,
}: {
  space: Spaces.Space;
  loadedTools: Spaces.SpaceTools;
  boards: TaskBoardSummary[];
  hubs: ResourceHubSummary[];
}) {
  const { t } = useTranslation();
  const paths = usePaths();
  const navigate = useNavigate();
  const { mutateAsync: updateTools, isPending } = Spaces.useUpdateSpaceTools();

  const management = useSpaceToolManagement(space.id);
  const handleToolAction = async (action: ToolAction) => {
    try {
      await management.mutateAsync(action);
      return true;
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      showErrorToast(t("Could not update space tools"), typeof message === "string" ? message : t("Please try again."));
      return false;
    }
  };

  const [tools, setTools] = React.useState<SpaceToolsConfigurationPage.ToolSettings>(() => ({
    discussionsEnabled: loadedTools.discussionsEnabled,
    resourceHubEnabled: loadedTools.resourceHubEnabled,
    tasksEnabled: loadedTools.tasksEnabled,
    kpisEnabled: loadedTools.kpisEnabled,
    templatesEnabled: loadedTools.templatesEnabled,
  }));

  const handleSave = React.useCallback(async () => {
    try {
      await updateTools({
        spaceId: space.id,
        tools,
      });

      navigate(paths.spacePath(space.id));
    } catch {
      showErrorToast(t("Could not save tool settings"), t("Please try again."));
    }
  }, [navigate, paths, space.id, tools, updateTools, t]);

  const handleCancel = React.useCallback(() => {
    navigate(paths.spacePath(space.id));
  }, [navigate, paths, space.id]);

  return (
    <SpaceToolsConfigurationPage
      title={[t("Configure tools"), space.name]}
      navigation={[{ label: space.name, to: paths.spacePath(space.id) }]}
      tools={tools}
      onToolsChange={setTools}
      onSave={handleSave}
      onCancel={handleCancel}
      isSubmitting={isPending}
      management={{
        boards,
        hubs,
        canEdit: space.permissions?.canEdit ?? false,
        onAction: handleToolAction,
      }}
    />
  );
}
