import * as People from "@/models/people";
import * as React from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import {
  AccountNotificationSettingsPage as NotificationSettingsPage,
  showErrorToast,
} from "turboui";

import { Paths, usePaths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router-dom";
import {
  buildNotificationSettingsUpdateInput,
  getNotificationSettingsFormState,
} from "./state";

export default { name: "AccountNotificationSettingsPage", loader, Page } as PageModule;

async function loader({ params }) {
  await redirectIfFeatureNotEnabled(params, {
    feature: "buffered_notifications",
    path: new Paths({ companyId: params.companyId! }).homePath(),
  });

  return null;
}

function Page() {
  const me = useMe()!;
  const navigate = useNavigate();
  const paths = usePaths();

  const initialState = React.useMemo(
    () =>
      getNotificationSettingsFormState({
        notifyOnMention: me.notifyOnMention,
        emailWindowMinutes: me.emailWindowMinutes,
        sendDailySummary: me.sendDailySummary,
      }),
    [me.notifyOnMention, me.emailWindowMinutes, me.sendDailySummary],
  );

  const [notifyOnMention, setNotifyOnMention] = React.useState(initialState.notifyOnMention);
  const [emailWindowMinutes, setEmailWindowMinutes] = React.useState(initialState.emailWindowMinutes);
  const [sendDailySummary, setSendDailySummary] = React.useState(initialState.sendDailySummary);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setNotifyOnMention(initialState.notifyOnMention);
    setEmailWindowMinutes(initialState.emailWindowMinutes);
    setSendDailySummary(initialState.sendDailySummary);
  }, [initialState]);

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);

    try {
      await People.updateProfile(
        buildNotificationSettingsUpdateInput(me.id, {
          notifyOnMention,
          emailWindowMinutes,
          sendDailySummary,
        }),
      );

      navigate(paths.accountSettingsPath());
    } catch {
      showErrorToast("Error", "Failed to update notification settings");
    } finally {
      setIsSubmitting(false);
    }
  }, [notifyOnMention, emailWindowMinutes, me.id, navigate, paths, sendDailySummary]);

  return (
    <NotificationSettingsPage
      notifyOnMention={notifyOnMention}
      emailWindowMinutes={emailWindowMinutes}
      sendDailySummary={sendDailySummary}
      onNotifyOnMentionChange={setNotifyOnMention}
      onEmailWindowMinutesChange={setEmailWindowMinutes}
      onSendDailySummaryChange={setSendDailySummary}
      onSubmit={handleSubmit}
      onCancel={() => navigate(paths.accountSettingsPath())}
      isSubmitting={isSubmitting}
      homePath={paths.homePath()}
      settingsPath={paths.accountSettingsPath()}
    />
  );
}
