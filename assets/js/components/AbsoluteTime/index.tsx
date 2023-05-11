import React from "react";
import { useTranslation } from "react-i18next";

export default function AbsoluteTime({ date }: Props): JSX.Element {
  const { t } = useTranslation();

  return <>{t("intlDateTime", { val: date })}</>;
}
