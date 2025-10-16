defmodule Operately.Activities.Notifications.ResourceHubDocumentEdited do
  def dispatch(_activity) do
    # dont send any notifications for editing a document
    {:ok, []}
  end
end
