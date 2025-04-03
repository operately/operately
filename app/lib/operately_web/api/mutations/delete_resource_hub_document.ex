defmodule OperatelyWeb.Api.Mutations.DeleteResourceHubDocument do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Document, Permissions}
  alias Operately.Operations.ResourceHubDocumentDeleting

  inputs do
    field :document_id, :id
  end

  outputs do
    field :document, :document
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:document, fn ctx -> find_document(ctx.me, inputs) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.document.request_info.access_level, :can_delete_document) end)
    |> run(:operation, fn ctx -> ResourceHubDocumentDeleting.run(ctx.me, ctx.document) end)
    |> run(:serialized, fn ctx -> {:ok, %{document: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :document, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp find_document(me, inputs) do
    Document.get(me, id: inputs.document_id, opts: [preload: [:node, :resource_hub]])
  end
end
