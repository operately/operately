import React from "react";
import { useTranslation } from "react-i18next";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { IconAlertTriangleFilled } from "../icons";
import { SecondaryButton } from "../Button";
import { Trans } from "../Translate";
import type { BillingDangerBannerViewModel } from "./types";

export type { BillingDangerBannerViewModel } from "./types";

export namespace BillingDangerBanner {
  export interface Props {
    banner: BillingDangerBannerViewModel;
    formattedTimePreferences: FormattedTimePreferences;
    hasSupportSession?: boolean;
  }
}

export function BillingDangerBanner({
  banner,
  formattedTimePreferences,
  hasSupportSession = false,
}: BillingDangerBanner.Props) {
  const { t } = useTranslation();
  const testId = banner.kind === "payment_default" ? "payment-default-banner" : "company-billing-danger-banner";
  const ctaTestId =
    banner.kind === "payment_default" ? "payment-default-banner-cta" : "company-billing-danger-banner-cta";

  return (
    <div
      className={`fixed left-0 right-0 z-[999] border-t-2 border-red-950/40 bg-red-700 shadow-2xl ${hasSupportSession ? "bottom-14 sm:bottom-12" : "bottom-0"}`}
      data-test-id={testId}
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0 flex w-full sm:w-auto flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white-1 shadow-sm">
            <IconAlertTriangleFilled size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white-1">
              {banner.kind === "over_limit"
                ? t("This company is over its plan limits")
                : banner.mode === "read_only"
                  ? t("This company is read-only")
                  : t("Payment issue requires attention")}
            </div>
            <p className="mt-1 text-sm text-white-1">
              <Description banner={banner} formattedTimePreferences={formattedTimePreferences} />
            </p>

            {banner.kind === "over_limit" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {banner.usageRows.map((row) => (
                  <div
                    key={row.label}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      row.state === "blocked"
                        ? "border-white/20 bg-white/15 font-semibold text-white-1"
                        : "border-white/20 bg-white/10 text-white-1/90"
                    }`}
                  >
                    <span className="font-semibold text-white-1">
                      {row.label === "Active members" ? t("Active members") : t("Storage used")}:
                    </span>{" "}
                    {row.value}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {banner.cta && (
          <div className="flex max-w-full shrink-0 items-start gap-2 pl-[52px] sm:pl-0">
            <SecondaryButton
              linkTo={banner.cta.to}
              size="sm"
              testId={ctaTestId}
              className="min-w-0 max-w-full !shrink whitespace-normal text-left !border-white/20 !bg-white !text-callout-error-content shadow-sm hover:!bg-red-50 hover:!text-callout-error-content"
            >
              {t("Review billing")}
            </SecondaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function Description({
  banner,
  formattedTimePreferences,
}: Pick<BillingDangerBanner.Props, "banner" | "formattedTimePreferences">) {
  const { t } = useTranslation();

  if (banner.kind === "payment_default") {
    if (banner.mode === "read_only") {
      return banner.shouldContactAdmin
        ? t(
            "Payment wasn't resolved in time. This company is now read-only, so collaborative work is paused until an admin or owner updates billing.",
          )
        : t(
            "Payment wasn't resolved in time. This company is now read-only, so collaborative work is paused until billing is updated.",
          );
    }

    if (!banner.deadline) {
      return banner.shouldContactAdmin
        ? t("Billing needs attention soon or this company will become read-only. Contact an admin or owner.")
        : t("Billing needs attention soon or this company will become read-only.");
    }

    const components = {
      date: <FormattedTime {...formattedTimePreferences} time={banner.deadline} format="long-date" />,
    };

    return banner.shouldContactAdmin ? (
      <Trans
        i18nKey="Billing needs attention by <date/> or this company will become read-only. Contact an admin or owner."
        components={components}
      />
    ) : (
      <Trans
        i18nKey="Billing needs attention by <date/> or this company will become read-only."
        components={components}
      />
    );
  }

  const members = banner.blockedLimitKeys.includes("member_count");
  const storage = banner.blockedLimitKeys.includes("storage_bytes");

  if (members && storage) {
    return banner.shouldContactAdmin
      ? t(
          "Adding or restoring people and uploading files are paused until this company is back within its plan limits. Contact an admin or owner.",
        )
      : t(
          "Adding or restoring people and uploading files are paused until this company is back within its plan limits. Review billing to change the plan or reduce usage.",
        );
  }

  if (members) {
    return banner.shouldContactAdmin
      ? t(
          "Adding or restoring people is paused until this company is back within its plan limits. Contact an admin or owner.",
        )
      : t(
          "Adding or restoring people is paused until this company is back within its plan limits. Review billing to change the plan or reduce usage.",
        );
  }

  return banner.shouldContactAdmin
    ? t("Uploading files is paused until this company is back within its plan limits. Contact an admin or owner.")
    : t(
        "Uploading files is paused until this company is back within its plan limits. Review billing to change the plan or reduce usage.",
      );
}
