import { PageModule } from "@/routes/types";
import { loader } from "./loader";
import { Page } from "./page";

export default { name: "CompanyAdminPage", loader, Page } as PageModule;
