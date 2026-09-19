import { PageModule } from "@/routes/types";
import { emptyLoader } from "@/components/Pages";
import { Page } from "./page";

export default { name: "SetupPage", loader: emptyLoader, onNavigate, Page } as PageModule;

function onNavigate() {
  if (window.appConfig.configured) {
    window.location.href = "/";
  }
}
