defmodule Operately.Search.Sources.CoreWork.Project do
  @behaviour Operately.Search.Source

  import Ecto.Query

  alias Operately.Projects.Project, as: ProjectRecord
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Search.Source

  @impl true
  def source_type, do: "project"

  @impl true
  def fetch_batch(cursor, limit) do
    base_query()
    |> after_cursor(cursor)
    |> order_by([project], asc: project.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def fetch_by_ids([]), do: {:ok, []}

  def fetch_by_ids(ids) do
    base_query()
    |> where([project], project.id in ^ids)
    |> order_by([project], asc: project.id)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def to_entry(%{resource: project} = record) do
    {:ok,
     %{
       company_id: record.company_id,
       access_context_id: record.access_context_id,
       resource_hub_id: nil,
       space_id: record.space_id,
       project_id: record.project_id,
       goal_id: record.goal_id,
       title: project.name,
       body: RichContent.to_plain_text(project.description),
       body_kind: "description",
       state: state(project),
       source_inserted_at: project.inserted_at,
       source_updated_at:
         Source.latest_timestamp([
           project.updated_at,
           record.space_updated_at,
           record.access_context_updated_at
         ])
     }}
  end

  defp base_query do
    from(project in ProjectRecord,
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      where: is_nil(space.deleted_at),
      select: %{
        id: project.id,
        resource: project,
        company_id: project.company_id,
        access_context_id: context.id,
        space_id: project.group_id,
        project_id: project.id,
        goal_id: project.goal_id,
        space_updated_at: space.updated_at,
        access_context_updated_at: context.updated_at
      }
    )
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [project], project.id > ^cursor)

  defp state(%{deleted_at: deleted_at}) when not is_nil(deleted_at), do: :archived
  defp state(%{closed_at: closed_at}) when not is_nil(closed_at), do: :closed
  defp state(%{status: "closed"}), do: :closed
  defp state(%{status: "paused"}), do: :paused
  defp state(_project), do: nil
end
