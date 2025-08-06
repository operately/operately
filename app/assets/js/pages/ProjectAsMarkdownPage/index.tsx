import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { PageModule } from "@/routes/types";
export default { name: "ProjectAsMarkdownPage", loader, Page } as PageModule;

interface LoaderResult {
  markdown: string;
}

async function loader({ params }): Promise<LoaderResult> {
  const data = await Projects.getProject({
    id: params.id,
    includeSpace: true,
    includeGoal: true,
    includeChampion: true,
    includeReviewer: true,
    includePermissions: true,
    includeContributors: true,
    includeKeyResources: true,
    includeMilestones: true,
    includeLastCheckIn: true,
    includePrivacy: true,
    includeRetrospective: true,
    includeMarkdown: true,
  });

  return { markdown: data.markdown! };
}

function Page() {
  const { markdown } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={"Project As Markdown"}>
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
