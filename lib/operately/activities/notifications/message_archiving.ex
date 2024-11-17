defmodule Operately.Activities.Notifications.MessageArchiving do
  def dispatch(_activity) do
    Operately.Notifications.bulk_create([])
  end
end
