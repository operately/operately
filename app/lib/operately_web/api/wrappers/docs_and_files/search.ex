defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.Search do
  @moduledoc """
  Searches Docs & Files by its Space, Project, or Goal scope.

  Select a hub with resource_hub_id, or derive it from folder_id where supported.
  A space_id alone selects its default resource hub. Supplied parent selectors
  must match the selected hub. Results include the resolved resource_hub_id.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.ResourceHubs.Search, as: ResourceHubSearch
  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope

  inputs do
    field? :resource_hub_id, :id, null: true
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :goal_id, :id, null: true
    field :query, :string, null: false
  end

  outputs do
    field :resource_hub_id, :id, null: false
    field :nodes, list_of(:resource_hub_node), null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, internal_inputs} <- HubScope.to_resource_hub_inputs(me, inputs) do
      ResourceHubSearch.call(conn, internal_inputs)
      |> HubScope.with_resolved_hub(internal_inputs.resource_hub_id)
    end
  end
end
