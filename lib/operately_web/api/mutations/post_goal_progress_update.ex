defmodule OperatelyWeb.Api.Mutations.PostGoalProgressUpdate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals
  alias Operately.Goals.Permissions
  alias Operately.Operations.GoalCheckIn

  inputs do
    field :content, :string
    field :goal_id, :string
    field :new_target_values, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:goal, fn ctx -> Goals.get_goal_with_access_level(ctx.attrs.goal_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.requester_access_level, :can_check_in) end)
    |> run(:operation, fn ctx -> GoalCheckIn.run(ctx.me, ctx.goal, ctx.attrs.content, ctx.attrs.target_values) end)
    |> run(:serialized, fn ctx -> {:ok, %{update: Serializer.serialize(ctx.operation, level: :full)}} end)
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

  defp parse_inputs(inputs) do
    {:ok, goal_id} = decode_id(inputs.goal_id)
    {:ok, %{
      goal_id: goal_id,
      target_values: Jason.decode!(inputs.new_target_values),
      content: Jason.decode!(inputs.content),
    }}
  end
end
