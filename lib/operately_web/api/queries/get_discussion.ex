defmodule OperatelyWeb.Api.Queries.GetDiscussion do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Messages.Message
  alias Operately.Groups.Permissions
  alias Operately.Notifications.Subscription

  inputs do
    field :id, :string
    field :include_author, :boolean
    field :include_reactions, :boolean
    field :include_space, :boolean
    field :include_space_members, :boolean
    field :include_subscriptions, :boolean
    field :include_potential_subscribers, :boolean
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:message, fn ctx -> load(ctx, inputs) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.message.request_info.access_level, :can_view_message) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussion: OperatelyWeb.Api.Serializer.serialize(ctx.message, level: :full)}} end)
    |> respond()
   end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :message, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx, inputs) do
    Message.get(ctx.me, id: ctx.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs),
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      include_reactions: [reactions: :person],
      include_space: :space,
      include_space_members: [space: [:members, :company]],
      include_subscriptions: Subscription.preload_subscriptions(),
      include_potential_subscribers: [:access_context, space: :members],
    ])
  end

  defp after_load(inputs) do
    Inputs.parse_includes(inputs, [
      include_potential_subscribers: &Message.set_potential_subscribers/1,
    ])
  end
end
