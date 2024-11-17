defmodule Operately.Activities.Notifications.MessageArchiving do
  def dispatch(_activity) do
    {:ok, []} # don't send any notifications
  end
end
