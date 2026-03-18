defmodule OperatelyWeb.Api.Projects.UpdateName do
  @moduledoc """
  Updates the name of a project.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions

  inputs do
    field :project_id, :id, null: false
    field :name, :string, null: false
  end

  outputs do
    field :project, :project, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(inputs.project_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :can_edit) end)
    |> run(:operation, fn ctx -> Projects.rename_project(ctx.me, ctx.project, inputs.name) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
