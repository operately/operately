import { PageModule } from "@/routes/types";
import { loader } from "./loader";
import { Page } from "./page";

export default { name: "ProfilePage", loader, Page } as PageModule;
