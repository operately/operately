defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdate do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.{Goal, Update, Permissions}
  alias Operately.Notifications.Subscription

  inputs do
    field :id, :string
    field :include_author, :boolean
    field :include_acknowledged_by, :boolean
    field :include_reactions, :boolean
    field :include_goal, :boolean
    field :include_goal_targets, :boolean
    field :include_reviewer, :boolean
    field :include_champion, :boolean
    field :include_space_members, :boolean
    field :include_subscriptions, :boolean
    field :include_potential_subscribers, :boolean
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:id, fn -> decode_id(inputs.id) end)
    |> Action.run(:update, fn ctx -> load(ctx, inputs) end)
    |> Action.run(:check_permissions, fn ctx -> Permissions.check(ctx.update.requester_access_level, :can_view) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(ctx.update, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :update, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx, inputs) do
    Update.get(ctx.me, id: ctx.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs, ctx.me),
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: :author,
      include_acknowledged_by: :acknowledged_by,
      include_reactions: [reactions: :person],
      include_goal: :goal,
      include_goal_targets: [goal: :targets],
      include_champion: [goal: :champion],
      include_reviewer: [goal: :reviewer],
      include_space_members: [goal: [group: [:members, :company]]],
      include_subscriptions: Subscription.preload_subscriptions(),
      include_potential_subscribers: [:access_context, goal: [:champion, :reviewer, group: :members]],
    ])
  end

  defp after_load(inputs, me) do
    Inputs.parse_includes(inputs, [
      include_potential_subscribers: &Update.set_potential_subscribers/1,
    ])
    ++
    [load_goal_permissions(me)]
  end

  defp load_goal_permissions(person) do
    fn update ->
      if Ecto.assoc_loaded?(update.goal) do
        goal = Goal.preload_permissions(update.goal, person)
        %{update | goal: goal}
      else
        update
      end
    end
  end
end
