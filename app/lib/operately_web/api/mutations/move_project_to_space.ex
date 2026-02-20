defmodule OperatelyWeb.Api.Mutations.MoveProjectToSpace do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectSpaceMoving

  inputs do
    field? :project_id, :string, null: true
    field? :space_id, :string, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project_id, fn -> decode_id(inputs.project_id) end)
    |> run(:space_id, fn -> decode_id(inputs.space_id) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(ctx.project_id, ctx.me.id) end)
    |> run(:project_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :has_full_access) end)
    |> run(:space_access_level, fn ctx -> {:ok, Groups.get_access_level(ctx.space_id, ctx.me.id)} end)
    |> run(:space_permissions, fn ctx -> Groups.Permissions.check(ctx.space_access_level, :can_view) end)
    |> run(:operation, fn ctx -> ProjectSpaceMoving.run(ctx.me, ctx.project, ctx.space_id) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{}}
      {:error, :project_id, _} -> {:error, :bad_request}
      {:error, :space_id, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :project_permissions, _} -> {:error, :forbidden}
      {:error, :space_permissions, _} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
