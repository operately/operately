import { fetchCompany } from "@/models/companies/companyLayoutQueries";
import { PageModule } from "@/routes/types";
import { shouldRevalidate } from "@/pages/WorkMapV2Page/routing";
import { loader, preload } from "./loader";
import { Page } from "./page";

export default {
  name: "SpaceWorkMapPage",
  loader,
  Page,
  shouldRevalidate,
  preload: async (args) => {
    const company = await fetchCompany();
    return preload(args, company.enabledExperimentalFeatures?.includes("work_map_v2"));
  },
} satisfies PageModule;
