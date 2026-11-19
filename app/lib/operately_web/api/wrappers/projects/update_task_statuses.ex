defmodule OperatelyWeb.Api.Wrappers.Projects.UpdateTaskStatuses do
  @moduledoc """
  Updates the available task statuses for a project.
  """

  use TurboConnect.Mutation

  inputs do
    field :project_id, :id, null: false
    field :task_statuses, list_of(:task_status), null: false
    field? :deleted_status_replacements, list_of(:deleted_status_replacement), null: true
  end

  outputs do
    field :success, :boolean, null: true
  end

  def call(conn, inputs) do
    me = conn.assigns.current_person

    with {:ok, project} <- Operately.Projects.Project.get(me, id: inputs.project_id),
         {:ok, board} <- OperatelyWeb.Api.Tasks.BoardScope.resolve(me, project, nil),
         {:ok, result} <- OperatelyWeb.Api.Tasks.UpdateBoardStatuses.call(conn, Map.put(inputs, :board_id, board.id)) do
      {:ok, Map.take(result, [:success])}
    end
  end
end
