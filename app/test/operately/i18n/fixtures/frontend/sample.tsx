import { Trans, useTranslation } from "react-i18next";
import { tn } from "@/i18n";

export function Sample({ name, count }: { name: string; count: number }) {
  const { t } = useTranslation();

  return (
    <>
      {t("Save")}
      {t("Hello {{name}}", { name })}
      {t("Close", { context: "button" })}
      {tn("1 task", "{{count}} tasks", count)}
      <Trans i18nKey="Click <link>here</link> to continue" />
      {t("Only in English")}
    </>
  );
}
