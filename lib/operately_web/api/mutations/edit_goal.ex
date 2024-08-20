defmodule OperatelyWeb.Api.Mutations.EditGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals
  alias Operately.Goals.Permissions
  alias Operately.Operations.GoalEditing

  inputs do
    field :goal_id, :string
    field :name, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :timeframe, :timeframe
    field :added_targets, list_of(:create_target_input)
    field :updated_targets, list_of(:update_target_input)
    field :description, :string
    field :anonymous_access_level, :integer
    field :company_access_level, :integer
    field :space_access_level, :integer
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> decode_inputs(inputs) end)
    |> run(:goal, fn ctx -> Goals.get_goal_with_access_level(ctx.attrs.goal_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.requester_access_level, :can_edit) end)
    |> run(:operation, fn ctx -> GoalEditing.run(ctx.me, ctx.goal, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :goal, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp decode_inputs(inputs) do
    {:ok, goal_id} = decode_id(inputs.goal_id)
    {:ok, champion_id} = decode_id(inputs.champion_id)
    {:ok, reviewer_id} = decode_id(inputs.reviewer_id)

    {:ok, Map.merge(inputs, %{
      goal_id: goal_id,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
    })}
  end
end
