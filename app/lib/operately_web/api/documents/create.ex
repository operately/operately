defmodule OperatelyWeb.Api.Documents.Create do
  @moduledoc """
  Creates a new document in a resource hub.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.ResourceHubDocumentCreating
  alias Operately.ResourceHubs.{Document, Permissions}
  alias OperatelyWeb.Api.ResourceHubs.ParentScope

  inputs do
    field? :resource_hub_id, :id, null: true
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
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:copied_document, fn ctx -> load_copied_document(ctx.me, inputs[:copied_document_id]) end)
    |> run(:hub_scope, fn -> ParentScope.parse_hub_scope(inputs) end)
    |> run(:attrs, fn ctx -> parse_inputs(ctx, inputs) end)
    |> run(:resource_hub, fn ctx -> ParentScope.get_resource_hub(ctx.me, ctx.hub_scope) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.resource_hub.request_info.access_level, :can_create_document, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ResourceHubDocumentCreating.run(ctx.me, ctx.resource_hub, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{document: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :hub_scope, _} -> {:error, :bad_request}
      {:error, :copied_document, _} -> {:error, :not_found}
      {:error, :resource_hub, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(ctx, inputs) do
    {:ok, Map.merge(inputs, %{
      content: inputs.content,
      post_as_draft: inputs[:post_as_draft],
      send_to_everyone: inputs[:send_notifications_to_everyone],
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: inputs[:subscriber_ids],
      copied_document: ctx.copied_document
    })}
  end

  defp load_copied_document(_, nil), do: {:ok, nil}
  defp load_copied_document(me, id), do: Document.get(me, id: id)
end
