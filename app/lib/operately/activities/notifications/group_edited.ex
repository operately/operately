defmodule Operately.Activities.Notifications.GroupEdited do
  def dispatch(_activity) do
    {:ok, []} # don't send any notifications
  end
end
