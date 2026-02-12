defmodule OperatelyWeb.Api.Queries.ListPossibleManagers do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query

  alias Operately.Repo
  alias Operately.People.Person
  alias Operately.Companies.Company
  alias Operately.Access.Filters

  inputs do
    field? :user_id, :id
    field? :query, :string, null: true
  end

  outputs do
    field :people, list_of(:person)
  end

  def call(conn, inputs) do
    load_people(conn, inputs)
    |> serialize()
    |> ok_tuple()
  end

  defp load_people(conn, inputs) do
    user_id = inputs[:user_id] || me(conn).id
    {:ok, me} = find_me(conn)

    if !check_permissions(me, inputs) do
      []
    else
      # Build a recursive CTE to find all reports (direct and indirect)
      # Start with all people who directly report to the user
      initial_query = from(p in Person,
        where: p.manager_id == ^user_id,
        select: p.id
      )

      # Recursively find all reports down the hierarchy
      recursive_reports = from(p in Person,
        join: r in "reports_hierarchy",
        on: p.manager_id == r.id,
        select: p.id
      )

      reports_cte = union_all(initial_query, ^recursive_reports)

      from(p in Person,
        left_join: r in "reports_hierarchy", on: p.id == r.id,
        where: p.company_id == ^me.company_id,
        where: p.id != ^user_id,
        where: not p.suspended,
        where: is_nil(r.id) # Exclude all direct and indirect reports
      )
      |> filter_by_query(inputs[:query])
      |> order_by([p], asc: p.full_name)
      |> recursive_ctes(true)
      |> with_cte("reports_hierarchy", as: ^reports_cte)
      |> Repo.all()
    end
  end

  defp filter_by_query(query, nil), do: query
  defp filter_by_query(query, search_query) do
    trimmed_query = String.trim(search_query)

    case trimmed_query do
      "" -> query
      _ -> from p in query, where: ilike(p.full_name, ^"%#{trimmed_query}%") or ilike(p.title, ^"%#{trimmed_query}%")
    end
  end

  defp check_permissions(me, inputs) do
    case inputs[:user_id] do
      nil -> true

      user_id ->
        from(c in Company, where: c.id == ^me.company_id)
        |> join(:inner, [c], p in Person, on: p.id == ^user_id and p.company_id == c.id)
        |> Filters.filter_by_view_access(me.id)
        |> Repo.exists?()
    end
  end

  defp ok_tuple(value) do
    {:ok, value}
  end

  def serialize(people) when is_list(people) do
    %{people: Serializer.serialize(people, level: :essential)}
  end
end
