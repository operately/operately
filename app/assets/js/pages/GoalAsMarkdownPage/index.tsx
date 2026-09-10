import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";
import { SecondaryButton } from "turboui";

import { PageModule } from "@/routes/types";
import { loader, useLoadedData } from "./loader";
export default { name: "GoalAsMarkdownPage", loader, Page } as PageModule;

function Page() {
  const { markdown } = useLoadedData();

  const [copied, setCopied] = React.useState(false);

  return (
    <Pages.Page title={"Goal As Markdown"}>
      <Paper.Root>
        <Paper.Body>
          <div className="flex justify-end mb-2">
            <SecondaryButton
              size="xs"
              testId={copied ? "goal-markdown-copied" : "goal-markdown-copy"}
              onClick={() => {
                navigator.clipboard.writeText(markdown);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </SecondaryButton>
          </div>
          <pre className="whitespace-pre-wrap">
            <code>{markdown}</code>
          </pre>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
