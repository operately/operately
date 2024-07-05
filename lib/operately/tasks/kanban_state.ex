defmodule Operately.Tasks.KanbanState do
  defstruct todo: [], in_progress: [], done: []

  def load(nil), do: initialize()
  def load(map) do
    if map == %{} do
      initialize()
    else
      %__MODULE__{
        :todo => map["todo"],
        :in_progress => map["in_progress"],
        :done => map["done"]
      }
    end
  end

  def initialize do
    %__MODULE__{
      :todo => [],
      :in_progress => [],
      :done => []
    }
  end

  def add_todo(kanban_state, task_id) do
    add(kanban_state, task_id, :todo, 0)
  end

  def add(kanban_state, task_id, status, column_index) when status in [:todo, :in_progress, :done] do
    kanban_state |> Map.update!(status, &List.insert_at(&1, column_index, task_id))
  end

  def remove(kanban_state, task_id, status) when status in [:todo, :in_progress, :done] do
    kanban_state |> Map.update!(status, &List.delete(&1, task_id))
  end

end
