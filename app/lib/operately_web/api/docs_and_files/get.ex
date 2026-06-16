defmodule OperatelyWeb.Api.DocsAndFiles.Get do
  @moduledoc """
  Retrieves a Docs & Files hub by ID, space ID, or project ID with optional related data.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.DocsAndFiles.HubScope
  alias OperatelyWeb.Api.ResourceHubs.Get, as: ResourceHubGet

  inputs do
    field? :id, :id, null: true
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :include_space, :boolean, null: true
    field? :include_project, :boolean, null: true
    field? :include_nodes, :boolean, null: true
    field? :include_potential_subscribers, :boolean, null: true
    field? :include_permissions, :boolean, null: true
  end

  outputs do
    field :resource_hub, :resource_hub, null: false
  end

  def call(conn, inputs) do
    with {:ok, internal_inputs} <- to_internal_inputs(conn, inputs) do
      ResourceHubGet.call(conn, internal_inputs)
    end
  end

  defp to_internal_inputs(conn, inputs) do
    include_keys = [:include_space, :include_project, :include_nodes, :include_potential_subscribers, :include_permissions]
    includes = Map.take(inputs, include_keys)

    with {:ok, me} <- find_me(conn),
         {:ok, hub_id} <- HubScope.resolve_hub_id(me, inputs, hub_key: :id) do
      {:ok, Map.put(includes, :id, hub_id)}
    end
  end
end
