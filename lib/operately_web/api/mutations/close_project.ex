defmodule OperatelyWeb.Api.Mutations.CloseProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Project, Permissions}
  alias Operately.Operations.ProjectClosed

  inputs do
    field :project_id, :string
    field :retrospective, :string
  end

  outputs do
    field :retrospective, :retrospective
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.project_id) end)
    |> run(:project, fn ctx -> Project.get(ctx.me, id: ctx.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.request_info.access_level, :can_close) end)
    |> run(:operation, fn ctx -> ProjectClosed.run(ctx.me, ctx.project, inputs.retrospective) end)
    |> run(:serialized, fn ctx -> {:ok, %{retrospective: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
