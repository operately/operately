import { PageModule } from "@/routes/types";
import { Page } from "./page";
import { loader } from "./loader";
import { shouldRevalidate } from "./revalidation";

export default { name: "ResourceHubDocumentPage", loader, Page, shouldRevalidate } as PageModule;
