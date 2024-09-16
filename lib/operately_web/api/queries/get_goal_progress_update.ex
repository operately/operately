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
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:id, fn -> decode_id(inputs.id) end)
    |> Action.run(:preload, fn -> include_requested(inputs) end)
    |> Action.run(:check_in, fn ctx -> load(ctx) end)
    |> Action.run(:check_permissions, fn ctx -> Permissions.check(ctx.check_in.requester_access_level, :can_view) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(ctx.check_in, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :check_in, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx) do
    Update.get(ctx.me, id: ctx.id, opts: [
      preload: ctx.preload,
    ])
    |> load_goal_permissions(ctx.me)
  end

  defp include_requested(inputs) do
    requested = extract_include_filters(inputs)

    preload =
      Enum.reduce(requested, [], fn include, result ->
        case include do
          :include_author -> [:author | result]
          :include_acknowledged_by -> [:acknowledged_by | result]
          :include_reactions -> [[reactions: :person] | result]
          :include_goal -> [:goal | result]
          :include_goal_targets -> [[goal: :targets] | result]
          :include_champion -> [[goal: :champion] | result]
          :include_reviewer -> [[goal: :reviewer] | result]
          :include_space_members -> [[goal: [group: [:members, :company]]] | result]
          :include_subscriptions -> [Subscription.preload_subscriptions() | result]
          _ -> result
        end
      end)

    {:ok, preload}
  end

  defp load_goal_permissions({:error, reason}, _), do: {:error, reason}
  defp load_goal_permissions({:ok, check_in}, person) do
    goal = Goal.preload_permissions(check_in.goal, person)
    {:ok, %{check_in | goal: goal}}
  end
end
