import * as React from "react";

import { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import { useMe } from "@/contexts/CurrentCompanyContext";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const language = resolveEffectiveLanguage(me?.language);

  React.useEffect(() => {
    applyLanguage(language);
  }, [language]);

  return children;
}
