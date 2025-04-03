defmodule Operately.Activities.Notifications.TaskStatusChange do
  def dispatch(_activity) do
    # no notification for check-in edits
    {:ok, []}
  end
end
