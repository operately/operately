import * as React from "react";

import { applyLanguage } from "@/i18n";
import { I18N_FEATURE_FLAG, resolveEffectiveLanguage } from "@/i18n/languages";
import { hasFeature } from "@/models/companies";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const { company } = useCompanyLoaderData();
  const language = resolveEffectiveLanguage(me?.language, hasFeature(company, I18N_FEATURE_FLAG));

  React.useEffect(() => {
    applyLanguage(language);
  }, [language]);

  return children;
}
