defmodule OperatelyWeb.Api.Tasks.ListTaskStatuses do
  @moduledoc """
  Lists the task statuses available for one task's project or space scope.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  alias Operately.Projects.Permissions
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :task_id, :id, null: false
  end

  outputs do
    field :task_statuses, list_of(:task_status), null: false
  end

  def call(conn, inputs) do
    with {:ok, task} <- Task.get(me(conn), id: inputs.task_id, opts: [preload: [:project, :space]]),
         {:ok, :allowed} <- Permissions.check(task.request_info.access_level, :can_view, company_read_only: company_read_only(conn)) do
      {:ok, %{task_statuses: Serializer.serialize(Task.available_statuses(task))}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, _} -> {:error, :not_found}
    end
  end
end
