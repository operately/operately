defmodule OperatelyWeb.Api.Mutations.DeleteGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.{Permissions, Goal}

  inputs do
    field? :goal_id, :id, null: true
  end

  outputs do
    field? :goal, :goal, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:goal, fn ctx -> Goal.get(ctx.me, id: inputs.goal_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :has_full_access) end)
    |> run(:operation, fn ctx -> Operately.Operations.GoalDeleting.run(ctx.goal) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: Serializer.serialize(ctx.operation)}} end)
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
