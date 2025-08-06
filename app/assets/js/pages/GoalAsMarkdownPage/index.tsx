import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { PageModule } from "@/routes/types";
export default { name: "GoalAsMarkdownPage", loader, Page } as PageModule;

interface LoaderResult {
  markdown: string;
}

async function loader({ params }): Promise<LoaderResult> {
  const data = await Goals.getGoal({
    id: params.id,
    includeSpace: true,
    includeChampion: true,
    includeReviewer: true,
    includePermissions: true,
    includeUnreadNotifications: true,
    includeLastCheckIn: true,
    includeAccessLevels: true,
    includePrivacy: true,
    includeRetrospective: true,
    includeChecklist: true,
    includeProjects: true,
    includeMarkdown: true,
  });

  return { markdown: data.markdown! };
}

export function Page() {
  const { markdown } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={"Goal As Markdown"}>
      <Paper.Root>
        <Paper.Body>
          <pre className="whitespace-pre-wrap">
            <code>{markdown}</code>
          </pre>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
