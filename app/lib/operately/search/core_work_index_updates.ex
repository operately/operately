defmodule Operately.Search.CoreWorkIndexUpdates do
  @moduledoc """
  Enqueues refreshes for child records that inherit project or goal data.

  Parent writes use these functions inside their canonical transaction so every
  owned search entry is refreshed after the commit.
  """

  import Ecto.Query

  alias Ecto.Multi
  alias Operately.Goals.Update
  alias Operately.Projects.{CheckIn, Milestone, Retrospective}
  alias Operately.Search.IndexUpdates
  alias Operately.Tasks.Task

  def enqueue_project(%Multi{} = multi, project_id_or_builder) do
    multi
    |> Multi.run(:project_child_search_ids, fn repo, changes ->
      project_id = resolve(project_id_or_builder, changes)

      {:ok,
       %{
         check_ins: ids_for(repo, CheckIn, :project_id, project_id),
         retrospectives: ids_for(repo, Retrospective, :project_id, project_id),
         milestones: ids_for(repo, Milestone, :project_id, project_id),
         tasks: ids_for(repo, Task, :project_id, project_id)
       }}
    end)
    |> IndexUpdates.enqueue(:search_project_check_ins, "project_check_in", fn changes ->
      changes.project_child_search_ids.check_ins
    end)
    |> IndexUpdates.enqueue(:search_project_retrospectives, "project_retrospective", fn changes ->
      changes.project_child_search_ids.retrospectives
    end)
    |> IndexUpdates.enqueue(:search_project_milestones, "milestone", fn changes ->
      changes.project_child_search_ids.milestones
    end)
    |> IndexUpdates.enqueue(:search_project_tasks, "task", fn changes ->
      changes.project_child_search_ids.tasks
    end)
  end

  def enqueue_goal(%Multi{} = multi, goal_id_or_builder) do
    multi
    |> Multi.run(:goal_child_search_ids, fn repo, changes ->
      goal_id = resolve(goal_id_or_builder, changes)
      {:ok, ids_for(repo, Update, :goal_id, goal_id)}
    end)
    |> IndexUpdates.enqueue(:search_goal_check_ins, "goal_check_in", fn changes ->
      changes.goal_child_search_ids
    end)
  end

  defp ids_for(repo, schema, parent_field, parent_id) do
    from(record in schema,
      where: field(record, ^parent_field) == ^parent_id,
      order_by: [asc: record.id],
      select: record.id
    )
    |> repo.all()
  end

  defp resolve(builder, changes) when is_function(builder, 1), do: builder.(changes)
  defp resolve(value, _changes), do: value
end
