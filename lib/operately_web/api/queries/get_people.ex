defmodule OperatelyWeb.Api.Queries.GetPeople do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.People.Person
  alias Operately.Companies.Company

  inputs do
    field :include_suspended, :boolean
    field :include_manager, :boolean
  end

  outputs do
    field :people, list_of(:person)
  end

  def call(conn, inputs) do
    people = load(me(conn), inputs)

    {:ok, %{people: Serializer.serialize(people, level: :full)}}
  end

  defp load(person, inputs) do
    from(c in Company,
      where: c.id == ^person.company_id,
      select: c.id
    )
    |> filter_by_view_access(person.id)
    |> Repo.one()
    |> load_people(inputs)
  end

  defp load_people(nil, _), do: []
  defp load_people(company_id, inputs) do
    from(p in Person,
      where: p.company_id == ^company_id,
      order_by: [asc: p.full_name]
    )
    |> include_suspended(inputs[:include_suspended])
    |> include_manager(inputs[:include_manager])
    |> Repo.all()
  end

  defp include_suspended(q, true), do: q
  defp include_suspended(q, _), do: from(p in q, where: is_nil(p.suspended_at))

  defp include_manager(q, true), do: from(p in q, preload: [:manager])
  defp include_manager(q, _), do: q
end
