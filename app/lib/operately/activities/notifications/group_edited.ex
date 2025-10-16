defmodule Operately.Activities.Notifications.GroupEdited do
  def dispatch(_activity) do
    # don't send any notifications
    {:ok, []}
  end
end
