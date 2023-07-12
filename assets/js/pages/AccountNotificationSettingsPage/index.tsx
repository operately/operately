import React from "react";

import * as Paper from "@/components/PaperContainer";
import Avatar from "@/components/Avatar";
import { useMe } from "@/graphql/Me";
import * as Forms from "@/components/Form";

export function AccountNotificationSettingsPage() {
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
          <NotificationsForm />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function NotificationsForm() {
  const [sendMeDailySummary, setSendMeDailySummary] = React.useState(true);
  const [sendOnMention, setSendOnMention] = React.useState(true);
  const [sendOnAssignment, setSendOnAssignment] = React.useState(true);

  const handleSubmit = () => {
    console.log("submit");
  };

  return (
    <Forms.Form onSubmit={handleSubmit} loading={false} isValid={true}>
      <Forms.Switch label="Send me daily summary emails" value={sendMeDailySummary} onChange={setSendMeDailySummary} />
      <Forms.Switch label="Notify me when I'm mentioned" value={sendOnMention} onChange={setSendOnMention} />
      <Forms.Switch
        label="Notify me about upcomming assignments"
        value={sendOnAssignment}
        onChange={setSendOnAssignment}
      />

      <Forms.SubmitArea>
        <Forms.SubmitButton>Save Changes</Forms.SubmitButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
