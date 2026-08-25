defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.Search do
  @moduledoc """
  Searches Docs & Files by its Space, Project, or Goal scope.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.ResourceHubs.Search, as: ResourceHubSearch
  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope

  inputs do
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :goal_id, :id, null: true
    field :query, :string, null: false
  end

  outputs do
    field :nodes, list_of(:resource_hub_node), null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, internal_inputs} <- HubScope.to_resource_hub_inputs(me, inputs) do
      ResourceHubSearch.call(conn, internal_inputs)
    else
      {:error, :bad_request} -> {:error, :bad_request}
      {:error, :not_found} -> {:error, :not_found}
    end
  end
end
