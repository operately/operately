defmodule OperatelyWeb.Api.Queries.GetResourceHubLink do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Link

  inputs do
    field :id, :id
    field :include_author, :boolean
    field :include_space, :boolean
    field :include_resource_hub, :boolean
    field :include_parent_folder, :boolean
    field :include_reactions, :boolean
    field :include_permissions, :boolean
    field :include_subscriptions_list, :boolean
    field :include_potential_subscribers, :boolean
    field :include_path_to_link, :boolean
  end

  outputs do
    field :link, :resource_hub_link
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:link, fn ctx -> load(ctx, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{link: Serializer.serialize(ctx.link, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :link, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(ctx, inputs) do
    Link.get(ctx.me, id: inputs.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      include_reactions: [reactions: :person],
      include_resource_hub: [node: :resource_hub],
      include_space: [resource_hub: :space],
      include_parent_folder: [node: [parent_folder: :node]],
      include_subscriptions_list: :subscription_list,
      always_include: :node,
    ])
  end

  defp after_load(inputs) do
    Inputs.parse_includes(inputs, [
      include_permissions: &Link.set_permissions/1,
      include_potential_subscribers: &Link.load_potential_subscribers/1,
      include_path_to_link: &Link.find_path_to_link/1,
    ])
  end
end
