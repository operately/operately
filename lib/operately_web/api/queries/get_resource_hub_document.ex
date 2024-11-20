defmodule OperatelyWeb.Api.Queries.GetResourceHubDocument do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Document

  inputs do
    field :id, :id
  end

  outputs do
    field :document, :resource_hub_document
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:document, fn ctx -> load(ctx, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{document: Serializer.serialize(ctx.document, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :document, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  def load(ctx, inputs) do
    Document.get(ctx.me, id: inputs.id, opts: [
      preload: :node
    ])
  end
end
