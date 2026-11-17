defmodule OperatelyWeb.Api.Projects.UpdateTasksView do
  @moduledoc """
  Updates the shared tasks List/Board view for a project.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.{Permissions, Project}

  inputs do
    field :project_id, :id, null: false
    field :tasks_view, :project_tasks_view, null: false
  end

  outputs do
    field :project, :project, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project, fn ctx ->
      Project.get(ctx.me, id: inputs.project_id, opts: [preload: [:task_board]])
    end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> Projects.update_project(ctx.project, %{tasks_view: inputs.tasks_view}) end)
    |> run(:broadcast, fn ctx ->
      OperatelyWeb.Api.Subscriptions.ProjectUpdated.broadcast_result({:ok, ctx.operation}, ctx.project.id)
      {:ok, :broadcast}
    end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation, level: :full)}} end)
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
