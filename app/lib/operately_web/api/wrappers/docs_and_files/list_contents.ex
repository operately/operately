defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.ListContents do
  @moduledoc """
  Lists contents in a Docs & Files hub or folder.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope
  alias OperatelyWeb.Api.ResourceHubs.ListNodes

  inputs do
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :goal_id, :id, null: true
    field? :folder_id, :id, null: true
    field? :include_comments_count, :boolean, null: true
    field? :include_children_count, :boolean, null: true
  end

  outputs do
    field :nodes, list_of(:resource_hub_node), null: false
    field :draft_nodes, list_of(:resource_hub_node), null: false
  end

  def call(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, filter} <- HubScope.resolve_filter(me, inputs),
         {:ok, internal_inputs} <- build_internal_inputs(filter, inputs) do
      ListNodes.call(conn, internal_inputs)
    else
      {:error, :bad_request} -> {:error, :bad_request}
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp build_internal_inputs(filter, inputs) do
    {:ok,
     Map.merge(filter, %{
       include_comments_count: inputs[:include_comments_count],
       include_children_count: inputs[:include_children_count]
     })}
  end
end
