defmodule OperatelyWeb.Api.Links.Get do
  @moduledoc """
  Retrieves a link by ID with optional related data.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Link
  alias Operately.Notifications.UnreadNotificationsLoader

  inputs do
    field :id, :id, null: false
    field? :include_author, :boolean, null: false
    field? :include_space, :boolean, null: false
    field? :include_project, :boolean, null: false
    field? :include_goal, :boolean, null: false
    field? :include_resource_hub, :boolean, null: false
    field? :include_parent_folder, :boolean, null: false
    field? :include_reactions, :boolean, null: false
    field? :include_permissions, :boolean, null: false
    field? :include_subscriptions_list, :boolean, null: false
    field? :include_potential_subscribers, :boolean, null: false
    field? :include_unread_notifications, :boolean, null: false
    field? :include_path_to_link, :boolean, null: false
  end

  outputs do
    field :link, :resource_hub_link, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:link, fn ctx -> load(ctx, inputs, company_read_only(conn)) end)
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

  defp load(ctx, inputs, company_read_only) do
    Link.get(ctx.me, id: inputs.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs, ctx.me, company_read_only),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      include_space: :space,
      include_project: [project: :group],
      include_reactions: [reactions: :person],
      include_parent_folder: [node: [parent_folder: :node]],
      include_subscriptions_list: :subscription_list,
      include_resource_hub: :resource_hub,
      include_goal: [goal: :group],
      always_include: :node,
    ])
  end

  defp after_load(inputs, me, company_read_only) do
    Inputs.parse_includes(inputs, [
      include_permissions: &Link.set_permissions(&1, company_read_only),
      include_unread_notifications: UnreadNotificationsLoader.load(me),
      include_potential_subscribers: &Link.load_potential_subscribers/1,
      include_path_to_link: &Link.find_path_to_link/1,
    ])
  end
end
