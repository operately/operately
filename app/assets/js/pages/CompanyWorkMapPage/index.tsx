import { PageModule } from "@/routes/types";

import { loader } from "./loader";
import { Page } from "./page";

/**
 * Prevents the loader from rerunning when only the search parameters change.
 * This ensures that when users change tabs via URL parameters, we don't reload the data.
 */

export default { name: "CompanyWorkMapPage", loader, Page } as PageModule;
