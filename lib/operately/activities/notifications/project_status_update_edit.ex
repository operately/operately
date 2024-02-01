defmodule Operately.Activities.Notifications.ProjectStatusUpdateEdit do
  def dispatch(_activity) do
    # no notification for check-in edits
    {:ok, []}
  end
end
