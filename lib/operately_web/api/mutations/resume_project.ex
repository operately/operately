defmodule OperatelyWeb.Api.Mutations.ResumeProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project_id, fn -> decode_id(inputs.project_id) end)
    |> run(:project, fn ctx -> Operately.Projects.get_project_with_access_level(ctx.project_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Operately.Projects.Permissions.check(ctx.project.requester_access_level, :can_pause) end)
    |> run(:operation, fn ctx -> Operately.Operations.ProjectResuming.run(ctx.me, ctx.project) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(ctx.operation)}} end)
    |> respond()
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
