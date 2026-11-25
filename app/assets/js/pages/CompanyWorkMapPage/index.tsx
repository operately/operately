import { PageModule } from "@/routes/types";

import { shouldRevalidate } from "@/pages/WorkMapV2Page/routing";
import { loader, preload } from "./loader";
import { Page } from "./page";

export default { name: "CompanyWorkMapPage", loader, preload, Page, shouldRevalidate } as PageModule;
