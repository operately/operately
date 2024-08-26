defmodule OperatelyWeb.Api.Mutations.ConnectGoalToProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Goals

  inputs do
    field :project_id, :string
    field :goal_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:inputs, fn -> parse_inputs(inputs) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(ctx.inputs.project_id, ctx.me.id) end)
    |> run(:goal, fn ctx -> Goals.get_goal_with_access_level(ctx.inputs.goal_id, ctx.me.id) end)
    |> run(:check_permissions, &check_permission/1)
    |> run(:operation, fn ctx -> Operately.Operations.ProjectGoalConnection.run(ctx.me, ctx.project, ctx.goal) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :project_id, _} -> {:error, :bad_request}
      {:error, :goal_id, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :goal, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    with {:ok, project_id} <- decode_id(inputs.project_id),
         {:ok, goal_id} <- decode_id(inputs.goal_id) do
      {:ok, %{inputs | project_id: project_id, goal_id: goal_id}}
    else
      _ -> {:error, :bad_request}
    end
  end

  defp check_permission(ctx) do
    with {:ok, _} <- Projects.Permissions.check(ctx.goal.requester_access_level, :can_edit_goal),
         {:ok, _} <- Goals.Permissions.check(ctx.project.requester_access_level, :can_edit) do
      {:ok, :allowed}
    else
      _ -> {:error, :forbidden}
    end
  end
end
