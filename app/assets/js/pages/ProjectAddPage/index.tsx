export type { UrlParams } from "./loader";
import { PageModule } from "@/routes/types";
import { loader } from "./loader";
import { Page } from "./page";

export default { name: "ProjectAddPage", loader, Page } as PageModule;
