import type { PageModule } from "@/routes/types";
import { loader, preload } from "./loader";
import { Page } from "./page";
import { shouldRevalidate } from "./routing";

export default { name: "WorkMapV2Page", Page, loader, preload, shouldRevalidate } satisfies PageModule;
