defmodule OperatelyWeb.Api.Mutations.EditResourceHubDocument do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Document, Permissions}
  alias Operately.Operations.ResourceHubDocumentEditing

  inputs do
    field :document_id, :id
    field :name, :string
    field :content, :string
  end

  outputs do
    field :document, :resource_hub_document
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_attrs(inputs) end)
    |> run(:document, fn ctx -> find_document(ctx.me, ctx.attrs) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.document.request_info.access_level, :can_edit_document) end)
    |> run(:operation, fn ctx -> ResourceHubDocumentEditing.run(ctx.me, ctx.document, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{document: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :document, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_attrs(inputs) do
    content = Jason.decode!(inputs.content)
    {:ok, Map.put(inputs, :content, content)}
  end

  defp find_document(me, inputs) do
    Document.get(me, id: inputs.document_id, opts: [
      preload: [:node, :resource_hub],
    ])
  end
end
