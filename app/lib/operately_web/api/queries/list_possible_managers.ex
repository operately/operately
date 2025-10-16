defmodule OperatelyWeb.Api.Queries.ListPossibleManagers do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query

  alias Operately.Repo
  alias Operately.People.Person

  inputs do
    field? :user_id, :id
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
    company_id = me(conn).company_id

    if !check_permissions(inputs, company_id) do
      []
    else
      # Build a recursive CTE to find all reports (direct and indirect)
      # Start with all people who directly report to the user
      initial_query =
        from(p in Person,
          where: p.manager_id == ^user_id,
          select: p.id
        )

      # Recursively find all reports down the hierarchy
      recursive_reports =
        from(p in Person,
          join: r in "reports_hierarchy",
          on: p.manager_id == r.id,
          select: p.id
        )

      reports_cte = union_all(initial_query, ^recursive_reports)

      from(p in Person,
        left_join: r in "reports_hierarchy",
        on: p.id == r.id,
        where: p.company_id == ^company_id,
        where: p.id != ^user_id,
        where: not p.suspended,
        # Exclude all direct and indirect reports
        where: is_nil(r.id),
        order_by: p.full_name
      )
      |> recursive_ctes(true)
      |> with_cte("reports_hierarchy", as: ^reports_cte)
      |> Repo.all()
    end
  end

  defp check_permissions(inputs, company_id) do
    case inputs[:user_id] do
      nil ->
        true

      user_id ->
        from(p in Person, where: p.id == ^user_id and p.company_id == ^company_id)
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
