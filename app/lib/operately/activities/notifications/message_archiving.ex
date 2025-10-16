defmodule Operately.Activities.Notifications.MessageArchiving do
  def dispatch(_activity) do
    # don't send any notifications
    {:ok, []}
  end
end
