import { runAiPrompt } from "@/api";
import * as Companies from "@/models/companies";
import * as React from "react";
import * as Turboui from "turboui";

import { Paths } from "@/routes/paths";
import { redirect } from "react-router-dom";

interface LoaderResult {}

export async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({
    id: params.companyId,
    includePermissions: true,
  }).then((d) => d.company!);

  if (Companies.hasFeature(company, "ai_playground")) {
    return {};
  } else {
    throw redirect(Paths.homePath());
  }
}

const initialPrompt = [
  "Act as a Chief Operating Officer (COO) of a company. You are responsible for ",
  "overseeing the company's operations and ensuring that everything runs ",
  "smoothly. You have access to a work map that contains all the goals and ",
  "projects of the company.",
  "\n\n",
  "How many projects are currently in progress?",
].join("");

export function Page() {
  const [prompt, setPrompt] = React.useState<string>(initialPrompt);
  const [response, setResponse] = React.useState<string>("");
  const [working, setWorking] = React.useState(false);

  const handleRunPrompt = async () => {
    try {
      setWorking(true);
      const result = await runAiPrompt({ prompt });
      setResponse(result.result!);
    } catch (error) {
      alert("Error running prompt: " + error.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mt-10">
      <Turboui.Page title={["AI Playground"]} size="medium">
        <div className="p-8">
          <div className="text-2xl font-bold">AI Playground</div>
          <div className="mt-2">
            This is a playground for AI features. The AI has access to all the data on the workmap.
          </div>

          <div className="mt-4 font-bold">Prompt</div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here..."
            className="mt-1 mb-4 w-full h-64 border border-surface-outline rounded-lg p-2"
          ></textarea>

          <Turboui.PrimaryButton size="sm" onClick={handleRunPrompt} loading={working}>
            Run
          </Turboui.PrimaryButton>

          {response && (
            <div className="mt-4">
              <div className="font-bold">Response</div>
              <pre>{response}</pre>
            </div>
          )}
        </div>
      </Turboui.Page>
    </div>
  );
}
