defmodule Operately.Search.Sources.CoreWork.Milestone do
  @behaviour Operately.Search.Source

  import Ecto.Query

  alias Operately.Projects.{Milestone, Project}
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Search.Source

  @impl true
  def source_type, do: "milestone"

  @impl true
  def fetch_batch(cursor, limit) do
    base_query()
    |> after_cursor(cursor)
    |> order_by([milestone], asc: milestone.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def fetch_by_ids([]), do: {:ok, []}

  def fetch_by_ids(ids) do
    base_query()
    |> where([milestone], milestone.id in ^ids)
    |> order_by([milestone], asc: milestone.id)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def to_entry(%{resource: %{deleted_at: deleted_at}}) when not is_nil(deleted_at), do: :skip
  def to_entry(%{project_deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip
  def to_entry(%{space_deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip

  def to_entry(%{resource: milestone} = record) do
    {:ok,
     %{
       company_id: record.company_id,
       access_context_id: record.access_context_id,
       resource_hub_id: nil,
       space_id: record.space_id,
       project_id: record.project_id,
       goal_id: record.goal_id,
       title: milestone.title,
       body: RichContent.to_plain_text(milestone.description),
       body_kind: "description",
       state: state(milestone, record),
       source_inserted_at: milestone.inserted_at,
       source_updated_at:
         Source.latest_timestamp([
           milestone.updated_at,
           record.project_updated_at,
           record.space_updated_at,
           record.access_context_updated_at
         ])
     }}
  end

  defp base_query do
    from(milestone in Milestone,
      # Load archived parents so refresh and reconciliation can remove stale entries.
      join: project in Project,
      on: project.id == milestone.project_id,
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      select: %{
        id: milestone.id,
        resource: milestone,
        company_id: project.company_id,
        access_context_id: context.id,
        space_id: project.group_id,
        project_id: project.id,
        goal_id: project.goal_id,
        project_status: project.status,
        project_closed_at: project.closed_at,
        project_deleted_at: project.deleted_at,
        project_updated_at: project.updated_at,
        space_deleted_at: space.deleted_at,
        space_updated_at: space.updated_at,
        access_context_updated_at: context.updated_at
      }
    )
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [milestone], milestone.id > ^cursor)

  defp state(%{status: :done}, _record), do: :completed
  defp state(%{completed_at: completed_at}, _record) when not is_nil(completed_at), do: :completed
  defp state(_milestone, record), do: Source.project_state(record)
end
