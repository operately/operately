defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateDocument do
  @moduledoc """
  Creates a new document in a Docs & Files hub.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope
  alias OperatelyWeb.Api.Documents.Create, as: DocumentCreate

  inputs do
    field? :space_id, :id, null: true
    field? :project_id, :id, null: true
    field? :folder_id, :id, null: true
    field :name, :string, null: false
    field :content, :json, null: false
    field? :post_as_draft, :boolean, null: true, default: false
    field? :send_notifications_to_everyone, :boolean, null: false, default: false, external_default: true
    field? :subscriber_ids, list_of(:id), null: false, default: []
    field? :copied_document_id, :id, null: true
  end

  outputs do
    field :document, :document, null: false
  end

  def call(conn, inputs) do
    with {:ok, internal_inputs} <- to_internal_inputs(conn, inputs) do
      DocumentCreate.call(conn, internal_inputs)
    end
  end

  defp to_internal_inputs(conn, inputs) do
    with {:ok, me} <- find_me(conn),
         {:ok, internal_inputs} <- HubScope.to_resource_hub_inputs(me, inputs) do
      {:ok, internal_inputs}
    end
  end
end
