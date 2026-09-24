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
  const { spaceId, space, tools } = useLoadedData();

  // The route ID stays stable when a background rename changes the returned space slug.
  return <ToolsForm key={spaceId} space={space} loadedTools={tools} />;
}

function ToolsForm({ space, loadedTools }: { space: Spaces.Space; loadedTools: Spaces.SpaceTools }) {
  const { t } = useTranslation();
  const paths = usePaths();
  const navigate = useNavigate();
  const { mutateAsync: updateTools, isPending } = Spaces.useUpdateSpaceTools();

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
    />
  );
}
