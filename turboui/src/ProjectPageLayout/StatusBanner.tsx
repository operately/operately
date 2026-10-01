import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { Trans } from "../Translate";
import { useTranslation } from "react-i18next";
import React from "react";
import { PrimaryButton } from "../Button";
import { Link } from "../Link";
import { IconPlayerPauseFilled, IconArchive } from "../icons";

export namespace StatusBanner {
  export interface Props {
    state: "paused" | "closed" | null;
    closedAt?: Date | null;
    reopenLink?: string;
    retrospectiveLink?: string;
    entityName?: "project" | "goal";
    formattedTimePreferences: FormattedTimePreferences;
  }
}

export function StatusBanner({
  state,
  closedAt,
  reopenLink,
  retrospectiveLink,
  entityName = "project",
  formattedTimePreferences,
}: StatusBanner.Props) {
  const { t } = useTranslation();
  if (state === "paused") {
    return (
      <div data-test-id="paused-status-banner" className="bg-callout-warning-bg border-y my-2 border-surface-outline">
        <div className="flex items-center justify-center max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <IconPlayerPauseFilled className="w-5 h-5 text-content-accent" />
            <div>
              <span className="text-content-accent font-medium">
                {entityName === "goal" ? t("This goal is paused") : t("This project is paused")}
              </span>
            </div>
            {reopenLink && (
              <PrimaryButton linkTo={reopenLink} size="xs">
                {t("Resume")}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "closed") {
    return (
      <div data-test-id="closed-status-banner" className="bg-callout-info-bg border-y my-2 border-surface-outline">
        <div className="flex items-center justify-center max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 text-callout-info-content">
            <IconArchive className="w-5 h-5" />
            <div>
              <span>
                {closedAt ? (
                  entityName === "goal" ? (
                    <Trans
                      i18nKey="This goal was closed on <date/>."
                      components={{
                        date: <FormattedTime {...formattedTimePreferences} time={closedAt} format="long-month-date" />,
                      }}
                    />
                  ) : (
                    <Trans
                      i18nKey="This project was closed on <date/>."
                      components={{
                        date: <FormattedTime {...formattedTimePreferences} time={closedAt} format="long-month-date" />,
                      }}
                    />
                  )
                ) : entityName === "goal" ? (
                  t("This goal was closed on an unknown date.")
                ) : (
                  t("This project was closed on an unknown date.")
                )}
              </span>
              {retrospectiveLink && (
                <>
                  {" "}
                  <Trans
                    i18nKey="Read the <resource>retrospective</resource>."
                    components={{ resource: <Link to={retrospectiveLink} className="font-bold" /> }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
