defmodule OperatelyWeb.Api.Mutations.CreateResourceHubDocument do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.ResourceHubDocumentCreating
  alias Operately.ResourceHubs.{Permissions, ResourceHub, Document}

  inputs do
    field :resource_hub_id, :id
    field :folder_id, :id
    field :name, :string
    field :content, :string
    field :send_notifications_to_everyone, :boolean
    field :subscriber_ids, list_of(:id)
    field :copied_document_id, :id
  end

  outputs do
    field :document, :document
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:copied_document, fn ctx -> load_copied_document(ctx.me, inputs[:copied_document_id]) end)
    |> run(:attrs, fn ctx -> parse_inputs(ctx, inputs) end)
    |> run(:resource_hub, fn ctx -> ResourceHub.get(ctx.me, id: ctx.attrs.resource_hub_id) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.resource_hub.request_info.access_level, :can_create_document) end)
    |> run(:operation, fn ctx -> ResourceHubDocumentCreating.run(ctx.me, ctx.resource_hub, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{document: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :copied_document, _} -> {:error, :not_found}
      {:error, :resource_hub, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(ctx, inputs) do
    content = Jason.decode!(inputs.content)

    {:ok, Map.merge(inputs, %{
      content: content,
      send_to_everyone: inputs[:send_notifications_to_everyone] || false,
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: inputs[:subscriber_ids] || [],
      copied_document: ctx.copied_document
    })}
  end

  defp load_copied_document(_, nil), do: {:ok, nil}
  defp load_copied_document(me, id), do: Document.get(me, id: id)
end
