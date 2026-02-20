defmodule OperatelyWeb.Api.Mutations.EditProjectPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectPermissionsEditing

  inputs do
    field? :project_id, :string, null: true
    field? :access_levels, :access_levels, null: true
  end

  outputs do
    field? :success, :boolean, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.project_id) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(ctx.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :has_full_access) end)
    |> run(:operation, fn ctx -> ProjectPermissionsEditing.run(ctx.me, ctx.project, inputs.access_levels) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, _} -> {:ok, %{success: true}}
      {:error, :me, _} -> {:error, :not_found}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end
end
