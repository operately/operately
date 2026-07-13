defmodule OperatelyWeb.Api.Spaces.GetDiscussion do
  @moduledoc """
  Retrieves a space discussion by ID with optional related data.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Messages.Message
  alias Operately.Groups.Permissions
  alias Operately.Notifications.UnreadNotificationsLoader

  inputs do
    field :id, :id, null: false
    field? :include_author, :boolean, null: true
    field? :include_reactions, :boolean, null: true
    field? :include_space, :boolean, null: true
    field? :include_space_members, :boolean, null: true
    field? :include_subscriptions_list, :boolean, null: true
    field? :include_potential_subscribers, :boolean, null: true
    field? :include_unread_notifications, :boolean, null: true
    field? :include_permissions, :boolean, null: true
  end

  outputs do
    field :discussion, :discussion, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:message, fn ctx -> load(ctx, inputs, company_read_only(conn)) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.message.request_info.access_level, :can_view, company_read_only: company_read_only(conn)) end)
    |> run(:check_draft_access, fn ctx -> check_draft_access(ctx.message, ctx.me) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussion: OperatelyWeb.Api.Serializer.serialize(ctx.message, level: :full)}} end)
    |> respond()
   end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :message, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      {:error, :check_draft_access, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx, inputs, company_read_only) do
    Message.get(ctx.me, id: inputs.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs, ctx.me, company_read_only),
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      include_reactions: [reactions: :person],
      include_space: :space,
      include_space_members: [space: [:members, :company]],
      include_subscriptions_list: :subscription_list,
      include_potential_subscribers: [:access_context, space: :members],
    ])
  end

  defp after_load(inputs, me, company_read_only) do
    Inputs.parse_includes(inputs, [
      include_potential_subscribers: &Message.set_potential_subscribers/1,
      include_unread_notifications: UnreadNotificationsLoader.load(me),
      include_permissions: &Message.set_permissions(&1, company_read_only),
    ])
  end
end
