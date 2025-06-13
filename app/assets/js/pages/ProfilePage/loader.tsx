import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import { DeprecatedPaths } from "@/routes/paths";
import { redirectIfFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  person: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureEnabled(params, {
    feature: "new_profile_page",
    path: DeprecatedPaths.profileV2Path(params.id),
  });

  return {
    person: await People.getPerson({
      id: params.id,
      includeManager: true,
      includeReports: true,
      includePeers: true,
    }).then((data) => data.person!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
