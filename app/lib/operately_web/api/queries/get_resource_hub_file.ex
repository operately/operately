defmodule OperatelyWeb.Api.Queries.GetResourceHubFile do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.File

  inputs do
    field :id, :id
    field :include_author, :boolean
    field :include_resource_hub, :boolean
    field :include_space, :boolean
    field :include_parent_folder, :boolean
    field :include_reactions, :boolean
    field :include_permissions, :boolean
    field :include_subscriptions_list, :boolean
    field :include_potential_subscribers, :boolean
    field :include_path_to_file, :boolean
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
      after_load: after_load(inputs, ctx.me),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      include_resource_hub: [node: :resource_hub],
      include_parent_folder: [node: [parent_folder: :node]],
      include_space: [resource_hub: :space],
      include_reactions: [reactions: :person],
      include_subscriptions_list: :subscription_list,
      always_include: [:node, :blob],
    ])
  end

  defp after_load(inputs, _me) do
    Inputs.parse_includes(inputs, [
      include_permissions: &File.set_permissions/1,
      include_potential_subscribers: &File.load_potential_subscribers/1,
      include_path_to_file: &File.find_path_to_file/1,
    ])
  end
end
