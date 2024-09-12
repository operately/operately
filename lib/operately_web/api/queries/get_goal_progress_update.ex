defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdate do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Goal
  alias Operately.Goals.Permissions

  inputs do
    field :id, :string
    field :include_goal, :boolean
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:id, fn -> decode_id(inputs.id) end)
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
    Operately.Goals.get_check_in(ctx.me, ctx.id)
    |> load_goal_permissions(ctx.me)
  end

  defp load_goal_permissions({:error, reason}, _), do: {:error, reason}
  defp load_goal_permissions({:ok, check_in}, person) do
    goal = Goal.preload_permissions(check_in.goal, person)
    {:ok, %{check_in | goal: goal}}
  end
end
