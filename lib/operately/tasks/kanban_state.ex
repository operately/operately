defmodule Operately.Tasks.KanbanState do
  def load(nil), do: initialize()
  def load(map), do: map

  def initialize do
    %{
      "todo" => [],
      "in_progress" => [],
      "done" => []
    }
  end

  def add_todo(kanban_state, task_id) do
    add(kanban_state, task_id, "todo", 0)
  end

  def add(kanban_state, task_id, status, column_index) do
    kanban_state |> Map.update!(status, &List.insert_at(&1, column_index, task_id))
  end

  def remove(kanban_state, task_id, status) do
    kanban_state |> Map.update!(status, &List.delete(&1, task_id))
  end

end
