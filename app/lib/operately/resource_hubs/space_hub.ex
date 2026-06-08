defmodule Operately.ResourceHubs.SpaceHub do
  alias Operately.Access
  alias Operately.ResourceHubs.ResourceHub

  def ensure_context!(%ResourceHub{} = hub) do
    case Access.get_context(resource_hub_id: hub.id) do
      nil ->
        {:ok, context} = Access.create_context(%{resource_hub_id: hub.id})
        context

      context ->
        context
    end
  end
end
