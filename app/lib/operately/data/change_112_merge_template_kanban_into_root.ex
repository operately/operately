defmodule Operately.Data.Change112MergeTemplateKanbanIntoRoot do
  @moduledoc """
  Merges per-milestone template kanban columns into each template's root
  `tasks_kanban_state`, so the template board matches projects (one map for all tasks).

  Idempotent: re-running keeps the same membership (first-seen order wins; missing
  tasks are appended by their status).
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Milestone, Task, Template}

  def run do
    Repo.transaction(fn ->
      templates()
      |> Enum.each(&merge_template_kanban/1)
    end)
  end

  defp templates do
    from(t in Template, preload: [:milestones, :tasks])
    |> Repo.all()
  end

  defp merge_template_kanban(template) do
    merged =
      template.milestones
      |> Enum.map(&normalize_state(&1.tasks_kanban_state))
      |> then(&[normalize_state(template.tasks_kanban_state) | &1])
      |> merge_states()
      |> append_missing_tasks(template.tasks)

    from(t in Template, where: t.id == ^template.id)
    |> Repo.update_all(set: [tasks_kanban_state: merged])
  end

  defp merge_states(states) do
    keys = states |> Enum.flat_map(&Map.keys/1) |> Enum.uniq()

    Enum.reduce(keys, %{}, fn key, acc ->
      ids =
        states
        |> Enum.flat_map(&Map.get(&1, key, []))
        |> Enum.uniq()

      Map.put(acc, key, ids)
    end)
  end

  defp append_missing_tasks(state, tasks) do
    listed = state |> Map.values() |> List.flatten() |> MapSet.new()

    Enum.reduce(tasks, state, fn task, acc ->
      path = task_path(task.id)

      if MapSet.member?(listed, path) do
        acc
      else
        key = task_status_key(task)
        Map.update(acc, key, [path], &(&1 ++ [path]))
      end
    end)
  end

  defp normalize_state(state) when is_map(state) do
    Map.new(state, fn {key, paths} ->
      list = if is_list(paths), do: Enum.filter(paths, &is_binary/1), else: []
      {to_string(key), list}
    end)
  end

  defp normalize_state(_state), do: %{}

  defp task_status_key(%{task_status: %{value: value}}) when is_binary(value) and value != "", do: value
  defp task_status_key(%{task_status: %{"value" => value}}) when is_binary(value) and value != "", do: value
  defp task_status_key(%{task_status: %{id: id}}) when is_binary(id) and id != "", do: id
  defp task_status_key(%{task_status: %{"id" => id}}) when is_binary(id) and id != "", do: id
  defp task_status_key(_task), do: "todo"

  defp task_path(id) when is_binary(id), do: Operately.ShortUuid.encode!(id)

  defmodule Template do
    use Operately.Schema

    schema "project_templates" do
      field :tasks_kanban_state, :map, default: %{}

      has_many :milestones, Milestone, foreign_key: :project_template_id
      has_many :tasks, Task, foreign_key: :project_template_id
    end
  end

  defmodule Milestone do
    use Operately.Schema

    schema "project_template_milestones" do
      field :project_template_id, :binary_id
      field :tasks_kanban_state, :map, default: %{}
    end
  end

  defmodule Task do
    use Operately.Schema

    schema "project_template_tasks" do
      field :project_template_id, :binary_id
      field :task_status, :map
    end
  end
end
