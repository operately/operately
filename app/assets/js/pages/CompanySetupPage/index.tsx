import { PageModule } from "@/routes/types";
import { loader } from "./loader";
import { Page } from "./page";

export default {
  name: "CompanySetupPage",
  loader,
  Page,
} as PageModule;
