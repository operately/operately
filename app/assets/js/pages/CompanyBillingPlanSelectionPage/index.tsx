import { PageModule } from "@/routes/types";
import { loader } from "../CompanyBillingPage/loader";
import { Page } from "./page";

export default { name: "CompanyBillingPlanSelectionPage", loader, Page } as PageModule;
