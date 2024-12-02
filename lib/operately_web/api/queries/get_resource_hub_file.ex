defmodule OperatelyWeb.Api.Queries.GetResourceHubFile do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.File

  inputs do
    field :id, :id
    field :include_author, :boolean
  end

  outputs do
    field :file, :resource_hub_file
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:file, fn ctx -> load(ctx, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{file: Serializer.serialize(ctx.file, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :file, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  def load(ctx, inputs) do
    File.get(ctx.me, id: inputs.id, opts: [
      preload: preload(inputs),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      always_include: [:node, :blob],
    ])
  end
end
