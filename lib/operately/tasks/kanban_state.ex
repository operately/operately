defmodule Operately.Tasks.KanbanState do

  def load(nil), do: initialize()
  def load(%{}), do: initialize()
  def load(map), do: map

  def initialize do
    %{
      todo: [],
      in_progress: [],
      done: [],
    }
  end

  def add_todo(kanban_state, task_id) do
    add(kanban_state, task_id, "todo")
  end

  def add(kanban_state, task_id, status) do
    column = String.to_atom(status)
    kanban_state |> Map.update!(column, &[task_id | &1])
  end

  def remove(kanban_state, task_id, status) do
    column = String.to_atom(status)
    kanban_state |> Map.update!(column, &List.delete(&1, task_id))
  end

end
