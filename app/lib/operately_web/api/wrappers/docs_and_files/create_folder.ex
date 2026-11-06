defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFolder do
  @moduledoc """
  Creates a new folder in a Docs & Files hub.

  Select a hub with resource_hub_id, or derive it from folder_id where supported.
  A space_id alone selects its default resource hub. Supplied parent selectors
  must match the selected hub. Results include the resolved resource_hub_id.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope
  alias OperatelyWeb.Api.ResourceHubs.CreateFolder, as: ResourceHubCreateFolder

  inputs do
    field? :resource_hub_id, :id, null: true
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :goal_id, :id, null: true
    field? :folder_id, :id, null: true
    field :name, :string, null: false
  end

  outputs do
    field :resource_hub_id, :id, null: false
    field :folder, :resource_hub_folder, null: false
  end

  def call(conn, inputs) do
    with {:ok, internal_inputs} <- to_internal_inputs(conn, inputs) do
      ResourceHubCreateFolder.call(conn, internal_inputs)
      |> HubScope.with_resolved_hub(internal_inputs.resource_hub_id)
    end
  end

  defp to_internal_inputs(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, hub_id} <- HubScope.resolve_hub_id(me, inputs) do
      {:ok, %{
        resource_hub_id: hub_id,
        folder_id: inputs[:folder_id],
        name: inputs[:name]
      }}
    end
  end
end
