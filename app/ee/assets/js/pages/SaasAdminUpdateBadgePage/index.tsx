import { useTranslation } from "react-i18next";
import { useUpdateUpdateBadgeSettings } from "@/ee/models/updateBadgeLifecycle";
import { useLoadedData } from "./loader";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { PageSection, SwitchToggle, showErrorToast, showSuccessToast } from "turboui";

export { loader } from "./loader";

export function Page() {
  const { t } = useTranslation();
  const { enabled: initialEnabled } = useLoadedData();
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const { mutateAsync: updateSettings } = useUpdateUpdateBadgeSettings();
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleChange = async (next: boolean) => {
    const previous = enabled;
    setEnabled(next);
    setSaving(true);

    try {
      const result = await updateSettings({ enabled: next });
      if (!result.success) {
        setEnabled(previous);
        showErrorToast(t("Could not update setting"), t("Please try again."));
        return;
      }

      setEnabled(result.enabled);
      showSuccessToast(
        t("Update badge setting saved"),
        next ? t("The badge is enabled.") : t("The badge is disabled."),
      );
    } catch {
      setEnabled(previous);
      showErrorToast(t("Could not update setting"), t("Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Pages.Page title={t("Update Badge")} testId="saas-admin-update-badge-page">
      <Paper.Root size="large">
        <Paper.Navigation items={[{ to: "/admin", label: t("Administration") }]} />
        <Paper.Body>
          <Paper.Header title={t("Update Badge")} />
          <div className="mt-12">
            <PageSection
              title={t("Navbar update badge")}
              subtitle={t(
                "When enabled, the navbar shows a badge when a newer Operately release is available. This setting applies to all companies.",
              )}
            >
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="text-sm text-content-base">{t("Show update badge")}</div>
                <SwitchToggle
                  label={t("Show update badge")}
                  labelHidden
                  value={enabled}
                  setValue={handleChange}
                  testId="update-badge-enabled-toggle"
                />
              </div>
              {saving ? <div className="text-xs text-content-dimmed mt-2">{t("Saving…")}</div> : null}
            </PageSection>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
