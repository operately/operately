defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFile do
  @moduledoc """
  Creates new files in a Docs & Files hub.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope
  alias OperatelyWeb.Api.Files.Create, as: FileCreate

  inputs do
    # Backward compatibility for CLIs <= 1.6.0: their cached catalog still documents
    # resource_hub_id on documents/create, links/create, and files/create.
    field? :resource_hub_id, :id, null: true

    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :folder_id, :id, null: true
    field :files, list_of(:resource_hub_uploaded_file), null: false
    field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
    field? :subscriber_ids, list_of(:id), null: false, default: []
  end

  outputs do
    field :files, list_of(:resource_hub_file), null: false
  end

  def call(conn, inputs) do
    with {:ok, internal_inputs} <- to_internal_inputs(conn, inputs) do
      FileCreate.call(conn, internal_inputs)
    end
  end

  defp to_internal_inputs(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, internal_inputs} <- HubScope.to_resource_hub_inputs(me, inputs) do
      {:ok, internal_inputs}
    end
  end
end
