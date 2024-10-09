defmodule OperatelyWeb.Api.Queries.GetActivity do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Activities
  alias Operately.Activities.{Activity, Preloader, Permissions}

  inputs do
    field :id, :string
    field :include_unread_goal_notifications, :boolean
  end

  outputs do
    field :activity, :activity
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:activity, fn ctx -> load(ctx, inputs) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.activity.request_info.access_level, :can_view) end)
    |> run(:serialized, fn ctx -> {:ok, %{activity: serialize(ctx.activity)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :activity, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(ctx, inputs) do
    Activity.get(ctx.me, id: ctx.id, opts: [
      preload: [:author, comment_thread: [reactions: :person]],
      after_load: after_load(inputs, ctx.me),
    ])
  end

  defp after_load(inputs, person) do
    Inputs.parse_includes(inputs, [
      include_unread_goal_notifications: load_unread_goal_notifications(person),
      always_include: &Activities.cast_content/1,
      always_include: &Preloader.preload/1,
    ])
  end

  defp serialize(activity) do
    OperatelyWeb.Api.Serializers.Activity.serialize(activity, [comment_thread: :full])
  end

  defp load_unread_goal_notifications(person) do
    fn activity ->
      Activity.load_unread_goal_notifications(activity, person)
    end
  end
end
