defmodule Operately.ResourceHubs.Summary do
  def __api_typename__, do: "resource_hub_summary"

  defstruct [:id, :name, :is_default]

  def build(hub, default_id) do
    %__MODULE__{id: hub.id, name: hub.name, is_default: hub.id == default_id}
  end
end
