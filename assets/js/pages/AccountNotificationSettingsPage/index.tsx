import React from "react";

import * as Paper from "@/components/PaperContainer";
import Avatar from "@/components/Avatar";
import { useMe, useUpdateNotificationsSettings } from "@/graphql/Me";
import * as Forms from "@/components/Form";

export async function loader(): Promise<null> {
  return null;
}

export function Page() {
  const { data } = useMe();

  if (!data) return null;

  const me = data.me;

  return (
    <Paper.Root size="small">
      <Paper.Navigation>
        <Paper.NavItem linkTo="/account">
          <Avatar person={me} size="tiny" />
          Account
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body minHeight="300px">
        <h1 className="text-2xl font-bold">Edit your notification preferences</h1>

        <div className="mt-8 flex flex-col gap-8">
          <NotificationsForm me={me} />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function NotificationsForm({ me }) {
  const [sendDailySummary, setSendDailySummary] = React.useState(me.sendDailySummary);
  const [notifyOnMention, setNotifyOnMention] = React.useState(me.notifyOnMention);
  const [notifyAboutAssignments, setNotifyAboutAssignment] = React.useState(me.notifyAboutAssignments);

  const [update, { loading }] = useUpdateNotificationsSettings({ onCompleted: redirectToAccountPage });

  const handleSubmit = () => {
    update({
      variables: {
        input: {
          sendDailySummary,
          notifyOnMention,
          notifyAboutAssignments,
        },
      },
    });
  };

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={true}>
      <Forms.Switch label="Send me daily summary emails" value={sendDailySummary} onChange={setSendDailySummary} />
      <Forms.Switch label="Notify me when I'm mentioned" value={notifyOnMention} onChange={setNotifyOnMention} />
      <Forms.Switch
        label="Notify me about upcomming assignments"
        value={notifyAboutAssignments}
        onChange={setNotifyAboutAssignment}
      />

      <Forms.SubmitArea>
        <Forms.SubmitButton>Save Changes</Forms.SubmitButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}

function redirectToAccountPage() {
  window.location.href = "/account";
}
