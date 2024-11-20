defmodule OperatelyWeb.Api.Queries.GetResourceHubFolder do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Folder

  inputs do
    field :id, :id
    field :include_nodes, :boolean
    field :include_resource_hub, :boolean
    field :include_path_to_folder, :boolean
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
      preload: preload(inputs),
      after_load: after_load(inputs),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_nodes: [child_nodes: [[folder: :node], [document: :node]]],
      include_resource_hub: [node: :resource_hub],
      always_include: :node,
    ])
  end

  def after_load(inputs) do
    Inputs.parse_includes(inputs, [
      include_path_to_folder: &Folder.find_path_to_folder/1,
    ])
  end
end
