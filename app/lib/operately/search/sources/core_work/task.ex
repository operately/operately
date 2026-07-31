defmodule Operately.Search.Sources.CoreWork.Task do
  @behaviour Operately.Search.Source

  import Ecto.Query

  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Search.Source
  alias Operately.Tasks.Task

  @impl true
  def source_type, do: "task"

  @impl true
  def fetch_batch(cursor, limit) do
    cursor
    |> fetch_owned_tasks(limit)
    |> Enum.sort_by(& &1.id)
    |> Enum.take(limit)
    |> then(&{:ok, &1})
  end

  @impl true
  def fetch_by_ids([]), do: {:ok, []}

  def fetch_by_ids(ids) do
    ids
    |> fetch_tasks_by_ids()
    |> Enum.sort_by(& &1.id)
    |> then(&{:ok, &1})
  end

  @impl true
  def to_entry(%{project_deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip
  def to_entry(%{space_deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip

  def to_entry(%{resource: task} = record) do
    {:ok,
     %{
       company_id: record.company_id,
       access_context_id: record.access_context_id,
       resource_hub_id: nil,
       space_id: record.space_id,
       project_id: record.project_id,
       goal_id: record.goal_id,
       title: task.name,
       body: RichContent.to_plain_text(task.description),
       body_kind: "description",
       state: state(task, record),
       source_inserted_at: task.inserted_at,
       source_updated_at:
         Source.latest_timestamp([
           task.updated_at,
           record.owner_updated_at,
           record.space_updated_at,
           record.access_context_updated_at
         ])
     }}
  end

  defp fetch_owned_tasks(cursor, limit) do
    project_tasks(cursor, limit) ++ space_tasks(cursor, limit)
  end

  defp fetch_tasks_by_ids(ids) do
    project_tasks_by_ids(ids) ++ space_tasks_by_ids(ids)
  end

  defp project_tasks(cursor, limit) do
    project_task_query()
    |> after_cursor(cursor)
    |> order_by([task], asc: task.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
  end

  defp space_tasks(cursor, limit) do
    space_task_query()
    |> after_cursor(cursor)
    |> order_by([task], asc: task.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
  end

  defp project_tasks_by_ids(ids) do
    project_task_query()
    |> where([task], task.id in ^ids)
    |> order_by([task], asc: task.id)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
  end

  defp space_tasks_by_ids(ids) do
    space_task_query()
    |> where([task], task.id in ^ids)
    |> order_by([task], asc: task.id)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
  end

  defp project_task_query do
    from(task in Task,
      # Load archived parents so refresh and reconciliation can remove stale entries.
      join: project in Project,
      on: project.id == task.project_id,
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      where: not is_nil(task.project_id) and is_nil(task.space_id),
      select: %{
        id: task.id,
        resource: task,
        company_id: project.company_id,
        access_context_id: context.id,
        space_id: project.group_id,
        project_id: project.id,
        goal_id: project.goal_id,
        project_status: project.status,
        project_closed_at: project.closed_at,
        project_deleted_at: project.deleted_at,
        space_deleted_at: space.deleted_at,
        owner_updated_at: project.updated_at,
        space_updated_at: space.updated_at,
        access_context_updated_at: context.updated_at
      }
    )
  end

  defp space_task_query do
    from(task in Task,
      join: space in Group,
      on: space.id == task.space_id,
      join: context in assoc(space, :access_context),
      where: not is_nil(task.space_id) and is_nil(task.project_id),
      select: %{
        id: task.id,
        resource: task,
        company_id: space.company_id,
        access_context_id: context.id,
        space_id: space.id,
        project_id: type(^nil, :binary_id),
        goal_id: type(^nil, :binary_id),
        project_status: type(^nil, :string),
        project_closed_at: type(^nil, :naive_datetime),
        project_deleted_at: type(^nil, :naive_datetime),
        space_deleted_at: space.deleted_at,
        owner_updated_at: space.updated_at,
        space_updated_at: space.updated_at,
        access_context_updated_at: context.updated_at
      }
    )
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [task], task.id > ^cursor)

  defp state(%{closed_at: closed_at}, _record) when not is_nil(closed_at), do: :completed
  defp state(%{task_status: %{closed: true}}, _record), do: :completed
  defp state(%{status: status}, _record) when status in ["done", "canceled"], do: :completed
  defp state(_task, record), do: Source.project_state(record)
end
