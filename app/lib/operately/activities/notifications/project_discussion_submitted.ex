defmodule Operately.Activities.Notifications.ProjectDiscussionSubmitted do
  defdelegate dispatch(activity), to: Operately.Activities.Notifications.DiscussionPosting
end
