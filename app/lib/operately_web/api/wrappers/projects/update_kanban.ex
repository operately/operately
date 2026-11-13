defmodule OperatelyWeb.Api.Wrappers.Projects.UpdateKanban do
  @moduledoc """
  Updates the kanban state of a task in a project.
  """

  use TurboConnect.Mutation

  alias OperatelyWeb.Api.Serializer

  inputs do
    field :project_id, :id, null: false
    field :task_id, :id, null: false
    field :status, :task_status, null: false
    field :kanban_state, :json, null: false
  end

  outputs do
    field :project, :project, null: false
    field :task, :task, null: false
  end

  def call(conn, inputs) do
    me = conn.assigns.current_person

    with {:ok, project} <- Operately.Projects.Project.get(me, id: inputs.project_id),
         {:ok, board} <- OperatelyWeb.Api.Tasks.BoardScope.resolve(me, project, nil),
         {:ok, result} <- OperatelyWeb.Api.Tasks.UpdateBoardKanban.call(conn, Map.put(inputs, :board_id, board.id)) do
      {:ok, %{project: Serializer.serialize(project, level: :essential), task: result.task}}
    end
  end
end
