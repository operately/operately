defmodule OperatelyWeb.Api.Tasks.Move do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Groups.Permissions, as: SpacePermissions
  alias Operately.Projects.Permissions, as: ProjectPermissions
  alias Operately.Operations.TaskMoving

  inputs do
    field :task_id, :id, null: false
    field :destination_type, :task_type, null: false
    field :destination_id, :id, null: false
  end

  outputs do
    field :task, :task, null: false
    field :destination_type, :task_type, null: false
    field :destination_id, :id, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:task, fn ctx -> load_task(ctx.me, inputs.task_id) end)
    |> run(:check_origin_permissions, fn ctx -> check_origin_permissions(ctx.task) end)
    |> run(:destination, fn ctx -> load_destination(ctx.me, inputs.destination_type, inputs.destination_id) end)
    |> run(:check_destination_permissions, fn ctx -> check_destination_permissions(inputs.destination_type, ctx.destination) end)
    |> run(:validate_destination, fn ctx -> validate_destination(inputs.destination_type, ctx.destination) end)
    |> run(:operation, fn ctx -> TaskMoving.run(ctx.me, ctx.task, inputs.destination_type, ctx.destination) end)
    |> run(:serialized, fn ctx ->
      {:ok, %{
        task: Serializer.serialize(ctx.operation.task, level: :full),
        destination_type: ctx.operation.destination_type,
        destination_id: destination_id(ctx.destination)
      }}
    end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} ->
        {:ok, ctx.serialized}

      {:error, :task, _} ->
        {:error, :not_found}

      {:error, :check_origin_permissions, _} ->
        {:error, :forbidden}

      {:error, :destination, _} ->
        {:error, :not_found}

      {:error, :check_destination_permissions, _} ->
        {:error, :forbidden}

      {:error, :validate_destination, _} ->
        {:error, :bad_request}

      {:error, :operation, _} ->
        {:error, :bad_request}

      _ ->
        {:error, :internal_server_error}
    end
  end

  defp load_task(me, task_id) do
    case Task.get(me, id: task_id, opts: [preload: [:space, project: :group]]) do
      {:ok, task} -> {:ok, task}
      _ -> {:error, :not_found}
    end
  end

  defp load_destination(me, :project, destination_id) do
    case Project.get(me, id: destination_id) do
      {:ok, project} -> {:ok, project}
      _ -> {:error, :not_found}
    end
  end

  defp load_destination(me, :space, destination_id) do
    case Group.get(me, id: destination_id) do
      {:ok, space} -> {:ok, space}
      _ -> {:error, :not_found}
    end
  end

  defp check_origin_permissions(task = %Task{}) do
    case Task.task_type(task) do
      "project" -> ProjectPermissions.check(task.request_info.access_level, :can_edit)
      "space" -> SpacePermissions.check(task.request_info.access_level, :can_edit)
      _ -> {:error, :forbidden}
    end
  end

  defp check_destination_permissions(:project, destination = %Project{}) do
    ProjectPermissions.check(destination.request_info.access_level, :can_edit)
  end

  defp check_destination_permissions(:space, destination = %Group{}) do
    SpacePermissions.check(destination.request_info.access_level, :can_edit)
  end

  defp validate_destination(:project, destination = %Project{}) do
    if destination.status == "active", do: {:ok, destination}, else: {:error, :invalid_destination}
  end

  defp validate_destination(:space, destination = %Group{}) do
    if tasks_enabled?(destination), do: {:ok, destination}, else: {:error, :invalid_destination}
  end

  defp validate_destination(_, _), do: {:error, :invalid_destination}

  defp tasks_enabled?(%Group{tools: tools}) when not is_nil(tools), do: tools.tasks_enabled == true
  defp tasks_enabled?(_), do: false

  defp destination_id(space = %Group{}), do: OperatelyWeb.Paths.space_id(space)
  defp destination_id(project = %Project{}), do: OperatelyWeb.Paths.project_id(project)
end
