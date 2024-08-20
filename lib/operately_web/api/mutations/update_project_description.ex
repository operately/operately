defmodule OperatelyWeb.Api.Mutations.UpdateProjectDescription do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions

  inputs do
    field :project_id, :string
    field :description, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project_id, fn -> decode_id(inputs.project_id) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(ctx.project_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :can_edit_description) end)
    |> run(:operation, fn ctx -> update_project_description(ctx.project, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def update_project_description(project, inputs) do
    Operately.Projects.update_project(project, %{description: Jason.decode!(inputs.description)})
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :project_id, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
