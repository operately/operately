import * as React from "react";
import * as Companies from "@/models/companies";
import * as Turboui from "turboui";

import { redirect } from "react-router-dom";
import { Paths } from "@/routes/paths";

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

export function Page() {
  return (
    <div className="mt-10">
      <Turboui.Page title={["AI Playground"]} size="medium">
        <div className="p-8">
          <div className="text-2xl font-bold">AI Playground</div>
          <div className="mt-2 max-w-lg">
            This is a playground for AI features. You can experiment with different AI models and see how they work.
          </div>
        </div>
      </Turboui.Page>
    </div>
  );
}
