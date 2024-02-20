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
    kanban_state
    |> Map.update!(:todo, &[task_id | &1])
  end

end
