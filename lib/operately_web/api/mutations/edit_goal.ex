defmodule OperatelyWeb.Api.Mutations.EditGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals
  alias Operately.Goals.Permissions
  alias Operately.Operations.GoalEditing

  inputs do
    field :goal_id, :id
    field :parent_goal_id, :id
    field :name, :string
    field :champion_id, :id
    field :reviewer_id, :id
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
    |> run(:goal, fn ctx -> Goals.get_goal_with_access_level(inputs.goal_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.requester_access_level, :can_edit) end)
    |> run(:operation, fn ctx -> GoalEditing.run(ctx.me, ctx.goal, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :goal, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
