defmodule Operately.Tasks.BoardSummary do
  def __api_typename__, do: "task_board_summary"
  defstruct [:id, :name, :position, :is_default, :archived_at]

  def build(board, default_id) do
    %__MODULE__{id: board.id, name: board.name, position: board.position, is_default: board.id == default_id, archived_at: board.archived_at}
  end
end
