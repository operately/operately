defmodule Operately.Search.Sources.CoreWork.ProjectRetrospective do
  @behaviour Operately.Search.Source

  import Ecto.Query

  alias Operately.Projects.Retrospective
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Search.Source

  @impl true
  def source_type, do: "project_retrospective"

  @impl true
  def fetch_batch(cursor, limit) do
    base_query()
    |> after_cursor(cursor)
    |> order_by([retrospective], asc: retrospective.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def fetch_by_ids([]), do: {:ok, []}

  def fetch_by_ids(ids) do
    base_query()
    |> where([retrospective], retrospective.id in ^ids)
    |> order_by([retrospective], asc: retrospective.id)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def to_entry(%{project_deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip
  def to_entry(%{space_deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip

  def to_entry(%{resource: retrospective} = record) do
    {:ok,
     %{
       company_id: record.company_id,
       access_context_id: record.access_context_id,
       resource_hub_id: nil,
       space_id: record.space_id,
       project_id: record.project_id,
       goal_id: record.goal_id,
       title: "Project retrospective",
       body: RichContent.to_plain_text(retrospective.content),
       body_kind: "content",
       state: project_state(record),
       source_inserted_at: retrospective.inserted_at,
       source_updated_at:
         Source.latest_timestamp([
           retrospective.updated_at,
           record.project_updated_at,
           record.space_updated_at,
           record.access_context_updated_at
         ])
     }}
  end

  defp base_query do
    from(retrospective in Retrospective,
      join: project in assoc(retrospective, :project),
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      select: %{
        id: retrospective.id,
        resource: retrospective,
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
  defp after_cursor(query, cursor), do: where(query, [retrospective], retrospective.id > ^cursor)

  defp project_state(%{project_closed_at: closed_at}) when not is_nil(closed_at), do: :closed
  defp project_state(%{project_status: "closed"}), do: :closed
  defp project_state(%{project_status: "paused"}), do: :paused
  defp project_state(_record), do: nil
end
