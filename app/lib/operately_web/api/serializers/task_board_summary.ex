defimpl OperatelyWeb.Api.Serializable, for: Operately.Tasks.BoardSummary do
  def serialize(board, level: :essential) do
    %{
      id: Operately.ShortUuid.encode!(board.id),
      space_id: board.space_id && OperatelyWeb.Paths.space_id(board.space_id),
      project_id: board.project_id && OperatelyWeb.Paths.project_id(board.project_id),
      name: board.name,
      position: board.position,
      is_default: board.is_default,
      archived_at: OperatelyWeb.Api.Serializer.serialize(board.archived_at)
    }
  end
end
