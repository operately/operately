defmodule OperatelyWeb.Api.Queries.GetPeople do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.People.Person
  alias Operately.Companies.Company

  inputs do
    field :only_suspended, :boolean

    field :include_suspended, :boolean
    field :include_manager, :boolean
    field :include_invitations, :boolean
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
    |> filter_by_suspended_status(!!inputs[:include_suspended], !!inputs[:only_suspended])
    |> include_manager(inputs[:include_manager])
    |> include_invitations(inputs[:include_invitations])
    |> Repo.all()
  end

  defp filter_by_suspended_status(query, include_suspended, only_suspended) do
    cond do
      only_suspended ->
        from(p in query, where: not is_nil(p.suspended_at))
      include_suspended ->
        query
      true ->
        from(p in query, where: is_nil(p.suspended_at))
    end
  end

  defp include_manager(q, true), do: from(p in q, preload: [:manager])
  defp include_manager(q, _), do: q

  defp include_invitations(q, true), do: from(p in q, preload: [invitation: :invitation_token])
  defp include_invitations(q, _), do: q
end
