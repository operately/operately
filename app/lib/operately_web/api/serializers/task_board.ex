defimpl OperatelyWeb.Api.Serializable, for: Operately.Tasks.TaskBoard do
  alias OperatelyWeb.Api.Serializer

  def serialize(board, level: :essential) do
    %{
      id: Operately.ShortUuid.encode!(board.id),
      space_id: board.space_id && OperatelyWeb.Paths.space_id(board.space_id),
      project_id: board.project_id && OperatelyWeb.Paths.project_id(board.project_id),
      name: board.name,
      archived_at: Serializer.serialize(board.archived_at),
      task_statuses: Serializer.serialize(board.task_statuses),
      tasks_kanban_state: Serializer.serialize(%Operately.Tasks.KanbanState{state: board.tasks_kanban_state || %{}})
    }
  end
end
