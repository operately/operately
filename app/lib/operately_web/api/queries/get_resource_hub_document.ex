defmodule OperatelyWeb.Api.Queries.GetResourceHubDocument do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Document
  alias Operately.Notifications.UnreadNotificationsLoader

  inputs do
    field? :id, :id, null: true
    field? :include_author, :boolean, null: true
    field? :include_space, :boolean, null: true
    field? :include_resource_hub, :boolean, null: true
    field? :include_parent_folder, :boolean, null: true
    field? :include_reactions, :boolean, null: true
    field? :include_permissions, :boolean, null: true
    field? :include_subscriptions_list, :boolean, null: true
    field? :include_potential_subscribers, :boolean, null: true
    field? :include_unread_notifications, :boolean, null: true
    field? :include_path_to_document, :boolean, null: true
  end

  outputs do
    field? :document, :resource_hub_document, null: true
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
      after_load: after_load(inputs, ctx.me),
    ])
  end

  def preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      include_reactions: [reactions: :person],
      include_resource_hub: [node: :resource_hub],
      include_parent_folder: [node: [parent_folder: :node]],
      include_space: [:space],
      include_subscriptions_list: :subscription_list,
      always_include: :node,
    ])
  end

  defp after_load(inputs, me) do
    Inputs.parse_includes(inputs, [
      include_permissions: &Document.set_permissions/1,
      include_unread_notifications: UnreadNotificationsLoader.load(me),
      include_potential_subscribers: &Document.load_potential_subscribers/1,
      include_path_to_document: &Document.find_path_to_document/1,
    ])
  end
end
