import { PageModule } from "@/routes/types";
import { loader } from "./loader";
import { Page } from "./page";

export default { name: "GoalV2Page", loader, Page } as PageModule;
