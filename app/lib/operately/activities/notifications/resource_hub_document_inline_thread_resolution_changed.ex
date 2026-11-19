defmodule Operately.Activities.Notifications.ResourceHubDocumentInlineThreadResolutionChanged do
  # Resolution is auditable but does not notify subscribers.
  def dispatch(_activity), do: :ok
end
