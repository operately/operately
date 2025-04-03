defmodule Operately.Activities.Notifications.ProjectRenamed do
  def dispatch(_activity) do
    # no notification for project renamed activity
    {:ok, []}
  end
end
