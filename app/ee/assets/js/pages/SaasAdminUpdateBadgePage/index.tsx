import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import * as AdminApi from "@/ee/admin_api";
import { PageSection, SwitchToggle, showErrorToast, showSuccessToast } from "turboui";

interface LoaderResult {
  enabled: boolean;
}

export async function loader(): Promise<LoaderResult> {
  const data = await AdminApi.getUpdateBadgeSettings({});
  return { enabled: data.enabled };
}

export function Page() {
  const { enabled: initialEnabled } = Pages.useLoadedData<LoaderResult>();
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [updateSettings] = AdminApi.useUpdateUpdateBadgeSettings();
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
        showErrorToast("Could not update setting", "Please try again.");
        return;
      }

      setEnabled(result.enabled);
      showSuccessToast("Update badge setting saved", next ? "The badge is enabled." : "The badge is disabled.");
    } catch {
      setEnabled(previous);
      showErrorToast("Could not update setting", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Pages.Page title="Update Badge" testId="saas-admin-update-badge-page">
      <Paper.Root size="large">
        <Paper.Navigation items={[{ to: "/admin", label: "Administration" }]} />
        <Paper.Body>
          <Paper.Header title="Update Badge" />
          <div className="mt-12">
            <PageSection
              title="Navbar update badge"
              subtitle="When enabled, the navbar shows a badge when a newer Operately release is available. This setting applies to all companies."
            >
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="text-sm text-content-base">Show update badge</div>
                <SwitchToggle
                  label="Show update badge"
                  labelHidden
                  value={enabled}
                  setValue={handleChange}
                  testId="update-badge-enabled-toggle"
                />
              </div>
              {saving ? <div className="text-xs text-content-dimmed mt-2">Saving…</div> : null}
            </PageSection>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
