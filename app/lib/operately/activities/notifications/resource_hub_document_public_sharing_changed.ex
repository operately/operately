defmodule Operately.Activities.Notifications.ResourceHubDocumentPublicSharingChanged do
  # Sharing changes are recorded in the feed without notifying every subscriber.
  def dispatch(_activity), do: :ok
end
