defmodule Operately.Search.Sources.CoreWork.Discussion do
  @behaviour Operately.Search.Source

  import Ecto.Query

  alias Operately.Search.DiscussionQuery
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Search.Source

  @impl true
  def source_type, do: "discussion"

  @impl true
  def fetch_batch(cursor, limit) do
    base_query()
    |> after_cursor(cursor)
    |> order_by([message], asc: message.id)
    |> limit(^limit)
    |> lock([message], fragment("FOR SHARE OF ?", message))
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def fetch_by_ids([]), do: {:ok, []}

  def fetch_by_ids(ids) do
    base_query()
    |> where([message], message.id in ^ids)
    |> order_by([message], asc: message.id)
    |> lock([message], fragment("FOR SHARE OF ?", message))
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def to_entry(%{resource: %{state: state}}) when state != :published, do: :skip

  def to_entry(%{resource: message} = record) do
    {:ok,
     %{
       company_id: record.company_id,
       access_context_id: record.access_context_id,
       resource_hub_id: nil,
       space_id: record.space_id,
       project_id: record.project_id,
       goal_id: record.goal_id,
       title: message.title || Date.to_iso8601(NaiveDateTime.to_date(message.inserted_at)),
       body: RichContent.to_plain_text(message.body),
       body_kind: "content",
       state: if(message.deleted_at, do: :archived, else: Source.project_state(record)),
       source_inserted_at: message.inserted_at,
       source_updated_at:
         Source.latest_timestamp([
           message.updated_at,
           record.space_updated_at,
           record.access_context_updated_at,
           record.scope_updated_at
         ])
     }}
  end

  defp base_query do
    from([message, board: board, project: project, space: space, context: context] in DiscussionQuery.with_owner(),
      select: %{
        id: message.id,
        resource: message,
        company_id: space.company_id,
        access_context_id: context.id,
        space_id: space.id,
        project_id: message.project_id,
        goal_id: project.goal_id,
        project_status: project.status,
        project_closed_at: project.closed_at,
        space_updated_at: space.updated_at,
        access_context_updated_at: context.updated_at,
        scope_updated_at: coalesce(project.updated_at, board.updated_at)
      }
    )
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [message], message.id > ^cursor)
end
