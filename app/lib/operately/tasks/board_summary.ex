defmodule Operately.Tasks.BoardSummary do
  def __api_typename__, do: "task_board_summary"
  defstruct [:space_id, :project_id, :id, :name, :position, :is_default, :archived_at]

  def build(board, default_id) do
    %__MODULE__{space_id: board.space_id, project_id: board.project_id, id: board.id, name: board.name, position: board.position, is_default: board.id == default_id, archived_at: board.archived_at}
  end
end
