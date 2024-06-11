defmodule OperatelyWeb.Api.Queries.SearchPeople do
  use TurboConnect.Query

  import Ecto.Query, only: [from: 2, limit: 2]

  alias Operately.Repo
  alias Operately.People.Person

  inputs do
    field :query, :string
    field :ignored_ids, list_of(:string)
  end

  outputs do
    field :people, list_of(:person)
  end

  @limit 10

  def call(conn, inputs) do
    Person
    |> match_by_full_name_or_title(inputs)
    |> limit_to_company(conn.assigns.current_account.person.company_id)
    |> ignore_ids(inputs.ignored_ids)
    |> order_asc_by_match_position(inputs)
    |> limit(@limit)
    |> Repo.all()
    |> serialize()
    |> ok_tuple()
  end

  defp match_by_full_name_or_title(query, inputs) do
    from p in query, where: ilike(p.full_name, ^"%#{inputs.query}%") or ilike(p.title, ^"%#{inputs.query}%")
  end

  defp order_asc_by_match_position(query, inputs) do
    from p in query, order_by: [
      asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^inputs.query, p.full_name), 
      asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^inputs.query, p.title),
      asc: p.full_name
    ]
  end

  defp ignore_ids(query, ignored_ids) do
    from p in query, where: p.id not in ^ignored_ids
  end

  defp limit_to_company(query, company_id) do
    from p in query, where: p.company_id == ^company_id
  end

  defp ok_tuple(value) do
    {:ok, value}
  end

  def serialize(people) when is_list(people) do
    %{people: Enum.map(people, &serialize/1)}
  end

  def serialize(person) do
    %{
      id: person.id,
      full_name: person.full_name,
      title: person.title,
      avatar_url: person.avatar_url
    }
  end
end
