defmodule OperatelyWeb.Api.Mutations.ReopenGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :message, :string
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:goal, fn ctx -> Operately.Goals.get_goal_with_access_level(ctx.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Operately.Goals.Permissions.check(ctx.goal.requester_access_level, :can_reopen) end)
    |> run(:operation, fn ctx -> Operately.Operations.GoalReopening.run(ctx.me, ctx.goal, inputs.message) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :goal, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
