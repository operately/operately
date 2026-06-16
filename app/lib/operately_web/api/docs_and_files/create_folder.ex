defmodule OperatelyWeb.Api.DocsAndFiles.CreateFolder do
  @moduledoc """
  Creates a new folder in a Docs & Files hub.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.DocsAndFiles.HubScope
  alias OperatelyWeb.Api.ResourceHubs.CreateFolder, as: ResourceHubCreateFolder

  inputs do
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :folder_id, :id, null: true
    field :name, :string, null: false
  end

  outputs do
    field :folder, :resource_hub_folder, null: false
  end

  def call(conn, inputs) do
    with {:ok, internal_inputs} <- to_internal_inputs(conn, inputs) do
      ResourceHubCreateFolder.call(conn, internal_inputs)
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
