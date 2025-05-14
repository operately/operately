import { PageModule } from "@/routes/types";
import { Page } from "./page";
import { loader } from "./loader";

export default { name: "SpacePage", loader, Page } as PageModule;
