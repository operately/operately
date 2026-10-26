defmodule OperatelyWeb.Api.Tasks.UpdateArchive do
  @moduledoc "Archives a closed task or restores an archived task to its board."
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  alias Operately.Projects.Permissions
  alias Operately.Operations.TaskArchiveUpdating

  inputs do
    field :task_id, :id, null: false
    field :archived, :boolean, null: false
  end

  outputs do
    field :task, :task, null: false
  end

  def call(conn, inputs) do
    with {:ok, task} <- Task.get(me(conn), id: inputs.task_id, opts: [preload: [:project, :space]]),
         {:ok, :allowed} <- Permissions.check(task.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         {:ok, task} <- TaskArchiveUpdating.run(me(conn), task, inputs.archived) do
      {:ok, %{task: Serializer.serialize(task, level: :full)}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :bad_request} -> {:error, :bad_request}
      {:error, :not_found} -> {:error, :not_found}
      {:error, _} -> {:error, :internal_server_error}
    end
  end
end
