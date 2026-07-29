defmodule Operately.Search.Sources.CoreWork.GoalCheckIn do
  @behaviour Operately.Search.Source

  import Ecto.Query

  alias Operately.Goals.Update
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Search.Source

  @impl true
  def source_type, do: "goal_check_in"

  @impl true
  def fetch_batch(cursor, limit) do
    base_query()
    |> after_cursor(cursor)
    |> order_by([check_in], asc: check_in.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def fetch_by_ids([]), do: {:ok, []}

  def fetch_by_ids(ids) do
    base_query()
    |> where([check_in], check_in.id in ^ids)
    |> order_by([check_in], asc: check_in.id)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def to_entry(%{resource: %{state: state}}) when state != :published, do: :skip
  def to_entry(%{goal_deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip
  def to_entry(%{space_deleted_at: deleted_at}) when not is_nil(deleted_at), do: :skip

  def to_entry(%{resource: check_in} = record) do
    {:ok,
     %{
       company_id: record.company_id,
       access_context_id: record.access_context_id,
       resource_hub_id: nil,
       space_id: record.space_id,
       project_id: nil,
       goal_id: record.goal_id,
       title: check_in_title(check_in),
       body: RichContent.to_plain_text(check_in.message),
       body_kind: "message",
       state: if(record.goal_closed_at, do: :closed),
       source_inserted_at: check_in.inserted_at,
       source_updated_at:
         Source.latest_timestamp([
           check_in.updated_at,
           record.goal_updated_at,
           record.space_updated_at,
           record.access_context_updated_at
         ])
     }}
  end

  defp base_query do
    from(check_in in Update,
      join: goal in assoc(check_in, :goal),
      join: space in assoc(goal, :group),
      join: context in assoc(goal, :access_context),
      select: %{
        id: check_in.id,
        resource: check_in,
        company_id: goal.company_id,
        access_context_id: context.id,
        space_id: goal.group_id,
        goal_id: goal.id,
        goal_closed_at: goal.closed_at,
        goal_deleted_at: goal.deleted_at,
        goal_updated_at: goal.updated_at,
        space_deleted_at: space.deleted_at,
        space_updated_at: space.updated_at,
        access_context_updated_at: context.updated_at
      }
    )
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [check_in], check_in.id > ^cursor)

  defp check_in_title(check_in) do
    date = check_in.published_at || check_in.inserted_at
    "Check-in on #{date |> Operately.Time.as_date() |> Date.to_iso8601()}"
  end
end
