import * as Api from "@/api";
import * as Pages from "@/components/Pages";
import * as React from "react";
import * as Turboui from "turboui";

interface LoaderResult {
  agents: Api.Ai.Agent[];
}

export async function loader({}): Promise<LoaderResult> {
  return {
    agents: await Api.ai.listAgents({}).then((d) => d.agents),
  };
}

export function Page() {
  const { agents } = Pages.useLoadedData<LoaderResult>();

  return (
    <Turboui.Page title="Manage AI Agents">
      <div className="text-content-accent text-3xl font-extrabold">Manage AI Agents</div>

      {agents.length === 0 ? (
        <div className="text-content-secondary text-lg mt-4">
          No AI agents found. You can create a new agent using the button below.
        </div>
      ) : (
        <div className="mt-4">
          {agents.map((agent) => (
            <div key={agent.id} className="mb-2">
              <span className="text-content-primary font-bold">{agent.name}</span> - {agent.description}
            </div>
          ))}
        </div>
      )}
    </Turboui.Page>
  );
}
