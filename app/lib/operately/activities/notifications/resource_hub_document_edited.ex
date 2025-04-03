defmodule Operately.Activities.Notifications.ResourceHubDocumentEdited do
  def dispatch(_activity) do
    {:ok, []} # dont send any notifications for editing a document
  end
end
