defmodule Operately.Search.Sources.CoreWork.Person do
  @behaviour Operately.Search.Source

  import Ecto.Query

  alias Operately.People.Person
  alias Operately.Repo
  alias Operately.Search.Source

  @impl true
  def source_type, do: "person"

  @impl true
  def fetch_batch(cursor, limit) do
    base_query()
    |> after_cursor(cursor)
    |> order_by([person], asc: person.id)
    |> limit(^limit)
    |> Source.lock_for_maintenance()
    |> Repo.all()
    |> then(&{:ok, &1})
  end

  @impl true
  def fetch_by_ids([]), do: {:ok, []}

  def fetch_by_ids(ids) do
    base_query()
    |> where([person], person.id in ^ids)
    |> order_by([person], asc: person.id)
    |> Source.lock_for_maintenance()
    |> Repo.all()
    |> then(&{:ok, &1})
  end

  @impl true
  def to_entry(%{resource: %{suspended: true}}), do: :skip
  def to_entry(%{resource: %{suspended_at: suspended_at}}) when not is_nil(suspended_at), do: :skip

  def to_entry(%{resource: person} = record) do
    {:ok,
     %{
       company_id: record.company_id,
       access_context_id: record.access_context_id,
       resource_hub_id: nil,
       space_id: nil,
       project_id: nil,
       goal_id: nil,
       title: person.full_name,
       body: person.title || "",
       body_kind: "title",
       state: nil,
       source_inserted_at: person.inserted_at,
       source_updated_at:
         Source.latest_timestamp([
           person.updated_at,
           record.company_updated_at,
           record.access_context_updated_at
         ])
     }}
  end

  defp base_query do
    from(person in Person,
      join: company in assoc(person, :company),
      join: context in assoc(company, :access_context),
      select: %{
        id: person.id,
        resource: person,
        company_id: company.id,
        company_name: company.name,
        access_context_id: context.id,
        company_updated_at: company.updated_at,
        access_context_updated_at: context.updated_at
      }
    )
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [person], person.id > ^cursor)
end
