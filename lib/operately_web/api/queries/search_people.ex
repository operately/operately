defmodule OperatelyWeb.Api.Queries.SearchPeople do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2, limit: 2]
  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.People.Person

  inputs do
    field :query, :string
    field :ignored_ids, list_of(:string)

    field :search_scope_type, :string
    field :search_scope_id, :string
  end

  outputs do
    field :people, list_of(:person)
  end

  @limit 10

  def call(conn, inputs) do
    inputs = parse_inputs(inputs)

    check_permissions(me(conn))
    |> load_people(inputs)
    |> serialize()
    |> ok_tuple()
  end

  defp check_permissions(person) do
    from(c in Company,
      where: c.id == ^person.company_id,
      select: c.id
    )
    |> filter_by_view_access(person.id)
    |> Repo.one()
  end

  defp load_people(nil, _), do: []
  defp load_people(company_id, inputs) do
    Person
    |> match_by_full_name_or_title(inputs)
    |> limit_to_company(company_id)
    |> ignore_ids(inputs[:ignored_ids] || [])
    |> order_asc_by_match_position(inputs)
    |> exclude_suspended()
    |> filter_by_search_scope(inputs[:search_scope_type], inputs[:search_scope_id])
    |> limit(@limit)
    |> Repo.all()
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
    ignored_ids = Enum.map(ignored_ids, fn id ->
      {:ok, decoded_id} = decode_id(id)
      decoded_id
    end)

    from p in query, where: p.id not in ^ignored_ids
  end

  defp limit_to_company(query, company_id) do
    from p in query, where: p.company_id == ^company_id
  end

  defp exclude_suspended(query) do
    from p in query, where: p.suspended == false
  end

  defp filter_by_search_scope(query, scope, id) do
    case {scope, id} do
      {"company", _} -> 
        query

      {"project", id} -> 
        from p in query,
          join: m in assoc(p, :access_group_memberships),
          join: g in assoc(m, :group),
          join: b in assoc(g, :bindings),
          join: c in assoc(b, :context),
          where: c.project_id == ^id and b.access_level > 0,
          group_by: p.id

      {"space", id} -> 
        from p in query,
          join: m in assoc(p, :access_group_memberships),
          join: g in assoc(m, :group),
          join: b in assoc(g, :bindings),
          join: c in assoc(b, :context),
          where: c.group_id == ^id and b.access_level > 0,
          group_by: p.id

      {"goal", id} -> 
        from p in query,
          join: m in assoc(p, :access_group_memberships),
          join: g in assoc(m, :group),
          join: b in assoc(g, :bindings),
          join: c in assoc(b, :context),
          where: c.goal_id == ^id and b.access_level > 0,
          group_by: p.id
    end
  end

  defp ok_tuple(value) do
    {:ok, value}
  end

  def serialize(people) when is_list(people) do
    %{people: Serializer.serialize(people, level: :essential)}
  end
  
  def parse_inputs(inputs) do
    if inputs[:search_scope_id] do
      {:ok, search_scope_id} = decode_id(inputs[:search_scope_id])
      %{inputs | search_scope_id: search_scope_id}
    else
      inputs
    end
  end
end
