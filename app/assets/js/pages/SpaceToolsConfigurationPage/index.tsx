import * as React from "react";

import Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

import { SpaceToolsConfigurationPage } from "turboui";

export default { name: "SpaceToolsConfigurationPage", loader, Page } as PageModule;

interface LoaderResult {
  space: Spaces.Space;
  tools: Spaces.SpaceTools;
}

async function loader({ params }): Promise<LoaderResult> {
  const [space, tools] = await Promise.all([
    Spaces.getSpace({ id: params.id }),
    Spaces.listSpaceTools({ spaceId: params.id }).then((data) => data.tools),
  ]);

  return { space, tools };
}

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const { space, tools: loadedTools } = Pages.useLoadedData() as LoaderResult;

  const [tools, setTools] = React.useState<SpaceToolsConfigurationPage.ToolSettings>({
    discussionsEnabled: loadedTools.discussionsEnabled,
    resourceHubEnabled: loadedTools.resourceHubEnabled,
    tasksEnabled: loadedTools.tasksEnabled,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSave = React.useCallback(async () => {
    setIsSubmitting(true);

    try {
      await Api.spaces.updateTools({
        spaceId: space.id,
        tools: {
          discussionsEnabled: tools.discussionsEnabled,
          resourceHubEnabled: tools.resourceHubEnabled,
          tasksEnabled: tools.tasksEnabled,
        },
      });

      navigate(paths.spacePath(space.id));
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, paths, space.id, tools.discussionsEnabled, tools.resourceHubEnabled, tools.tasksEnabled]);

  const handleCancel = React.useCallback(() => {
    navigate(paths.spacePath(space.id));
  }, [navigate, paths, space.id]);

  return (
    <SpaceToolsConfigurationPage
      title={["Configure tools", space.name]}
      navigation={[{ label: space.name, to: paths.spacePath(space.id) }]}
      tools={tools}
      onToolsChange={setTools}
      onSave={handleSave}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    />
  );
}
