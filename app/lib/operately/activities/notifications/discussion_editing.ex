defmodule Operately.Activities.Notifications.DiscussionEditing do
  def dispatch(_activity) do
    # no notification for editing discussions
    {:ok, []}
  end
end
