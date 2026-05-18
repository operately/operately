import * as People from "@/models/people";
import * as React from "react";

import { emptyLoader } from "@/components/Pages";
import { useMe } from "@/contexts/CurrentCompanyContext";
import {
  AccountNotificationSettingsPage as NotificationSettingsPage,
  showErrorToast,
} from "turboui";

import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router-dom";
import {
  buildNotificationSettingsUpdateInput,
  getNotificationSettingsFormState,
} from "./state";

export default { name: "AccountNotificationSettingsPage", loader: emptyLoader, Page } as PageModule;

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
        dailySummaryDeliveryTime: me.dailySummaryDeliveryTime,
        notifyAboutAssignments: me.notifyAboutAssignments,
      }),
    [me.notifyOnMention, me.emailWindowMinutes, me.sendDailySummary, me.dailySummaryDeliveryTime, me.notifyAboutAssignments],
  );

  const [notifyOnMention, setNotifyOnMention] = React.useState(initialState.notifyOnMention);
  const [emailWindowMinutes, setEmailWindowMinutes] = React.useState(initialState.emailWindowMinutes);
  const [sendDailySummary, setSendDailySummary] = React.useState(initialState.sendDailySummary);
  const [dailySummaryDeliveryTime, setDailySummaryDeliveryTime] = React.useState(initialState.dailySummaryDeliveryTime);
  const [notifyAboutAssignments, setNotifyAboutAssignments] = React.useState(initialState.notifyAboutAssignments);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setNotifyOnMention(initialState.notifyOnMention);
    setEmailWindowMinutes(initialState.emailWindowMinutes);
    setSendDailySummary(initialState.sendDailySummary);
    setDailySummaryDeliveryTime(initialState.dailySummaryDeliveryTime);
    setNotifyAboutAssignments(initialState.notifyAboutAssignments);
  }, [initialState]);

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);

    try {
      await People.updateProfile(
        buildNotificationSettingsUpdateInput(me.id, {
          notifyOnMention,
          emailWindowMinutes,
          sendDailySummary,
          dailySummaryDeliveryTime,
          notifyAboutAssignments,
        }),
      );

      navigate(paths.accountSettingsPath());
    } catch {
      showErrorToast("Error", "Failed to update notification settings");
    } finally {
      setIsSubmitting(false);
    }
  }, [notifyOnMention, emailWindowMinutes, me.id, navigate, paths, sendDailySummary, dailySummaryDeliveryTime, notifyAboutAssignments]);

  return (
    <NotificationSettingsPage
      notifyOnMention={notifyOnMention}
      emailWindowMinutes={emailWindowMinutes}
      sendDailySummary={sendDailySummary}
      dailySummaryDeliveryTime={dailySummaryDeliveryTime}
      onNotifyOnMentionChange={setNotifyOnMention}
      onEmailWindowMinutesChange={setEmailWindowMinutes}
      onSendDailySummaryChange={setSendDailySummary}
      onDailySummaryDeliveryTimeChange={setDailySummaryDeliveryTime}
      notifyAboutAssignments={notifyAboutAssignments}
      onNotifyAboutAssignmentsChange={setNotifyAboutAssignments}
      onSubmit={handleSubmit}
      onCancel={() => navigate(paths.accountSettingsPath())}
      isSubmitting={isSubmitting}
      homePath={paths.homePath()}
      settingsPath={paths.accountSettingsPath()}
    />
  );
}
