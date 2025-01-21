defmodule OperatelyWeb.Api.Mutations.PublishResourceHubDocument do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Document
  alias Operately.Operations.ResourceHubDocumentPublishing

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
    |> run(:document, fn ctx -> load(ctx.me, inputs.document_id) end)
    |> run(:permissions, fn ctx -> authorize(ctx.me, ctx.document) end)
    |> run(:operation, fn ctx -> ResourceHubDocumentPublishing.run(ctx.me, ctx.document, ctx.attrs) end)
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

  defp load(me, document_id) do
    Document.get(me, id: document_id, opts: [
      preload: [:node, :resource_hub]
    ])
  end

  defp authorize(me, document) do
    cond do
      document.state != :draft -> {:error, :forbidden}
      document.author_id != me.id -> {:error, :forbidden}
      true -> {:ok, :allowed}
    end
  end
end
