import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import type { Loader } from "@/routes/types";

export const loader: Loader = async ({ params }) => {
  await redirectIfFeatureNotEnabled(params, {
    feature: "full_text_search",
    path: Paths.companyHomePath(params.companyId),
  });

  return null;
};
