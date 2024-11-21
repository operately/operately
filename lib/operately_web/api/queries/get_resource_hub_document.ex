defmodule OperatelyWeb.Api.Queries.GetResourceHubDocument do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Document

  inputs do
    field :id, :id
    field :include_author, :boolean
    field :include_resource_hub, :boolean
    field :include_parent_folder, :boolean
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
      preload: preload(inputs),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      include_resource_hub: [node: :resource_hub],
      include_parent_folder: [node: [parent_folder: :node]],
      always_include: :node,
    ])
  end
end
