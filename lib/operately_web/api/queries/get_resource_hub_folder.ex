defmodule OperatelyWeb.Api.Queries.GetResourceHubFolder do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Folder

  inputs do
    field :id, :id
  end

  outputs do
    field :folder, :resource_hub_folder
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:folder, fn ctx -> load(ctx, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{folder: Serializer.serialize(ctx.folder, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :folder, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  def load(ctx, inputs) do
    Folder.get(ctx.me, id: inputs.id, opts: [
      preload: [:node, :child_nodes]
    ])
  end
end
