defmodule OperatelyWeb.Api.Mutations.UpdateTaskStatus do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks
  alias Operately.Projects.Permissions  
  alias Operately.Operations.TaskStatusChange

  inputs do
    field :task_id, :string
    field :status, :string
    field :column_index, :integer
  end

  outputs do
    field :task, :task
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:id, fn -> decode_id(inputs.task_id) end)
    |> run(:author, fn -> find_me(conn) end)
    |> run(:task, fn ctx -> Tasks.get_task_with_access_level(ctx.id, ctx.author.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.task.requester_access_level, :can_edit_task) end)
    |> run(:operation, fn ctx -> TaskStatusChange.run(ctx.author, ctx.id, inputs.status, inputs.column_index) end)
    |> run(:serialized, fn ctx -> {:ok, %{task: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :author, _} -> {:error, :unauthorized}
      {:error, :task, _} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end
end
