defmodule Operately.Search.Sources.CoreWork.Goal do
  @behaviour Operately.Search.Source

  import Ecto.Query

  alias Operately.Goals.Goal, as: GoalRecord
  alias Operately.Repo
  alias Operately.RichContent
  alias Operately.Search.Source

  @impl true
  def source_type, do: "goal"

  @impl true
  def fetch_batch(cursor, limit) do
    base_query()
    |> after_cursor(cursor)
    |> order_by([goal], asc: goal.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def fetch_by_ids([]), do: {:ok, []}

  def fetch_by_ids(ids) do
    base_query()
    |> where([goal], goal.id in ^ids)
    |> order_by([goal], asc: goal.id)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> then(&{:ok, &1})
  end

  @impl true
  def to_entry(%{resource: goal} = record) do
    {:ok,
     %{
       company_id: record.company_id,
       access_context_id: record.access_context_id,
       resource_hub_id: nil,
       space_id: record.space_id,
       project_id: record.project_id,
       goal_id: record.goal_id,
       title: goal.name,
       body: RichContent.to_plain_text(goal.description),
       body_kind: "description",
       state: if(goal.closed_at, do: :closed),
       source_inserted_at: goal.inserted_at,
       source_updated_at:
         Source.latest_timestamp([
           goal.updated_at,
           record.space_updated_at,
           record.access_context_updated_at
         ])
     }}
  end

  defp base_query do
    from(goal in GoalRecord,
      join: space in assoc(goal, :group),
      join: context in assoc(goal, :access_context),
      where: is_nil(goal.deleted_at) and is_nil(space.deleted_at),
      select: %{
        id: goal.id,
        resource: goal,
        company_id: goal.company_id,
        access_context_id: context.id,
        space_id: goal.group_id,
        project_id: type(^nil, :binary_id),
        goal_id: goal.id,
        space_updated_at: space.updated_at,
        access_context_updated_at: context.updated_at
      }
    )
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [goal], goal.id > ^cursor)
end
