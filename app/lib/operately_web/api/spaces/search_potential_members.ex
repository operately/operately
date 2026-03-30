defmodule OperatelyWeb.Api.Spaces.SearchPotentialMembers do
  @moduledoc """
  Searches for potential members to add to a space.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.People.Person
  alias Operately.Groups.{Group, Member}

  inputs do
    field :space_id, :id, null: false
    field? :query, :string, null: false
    field? :exclude_ids, list_of(:id), null: false
    field? :limit, :integer, null: false
  end

  outputs do
    field :people, list_of(:person), null: false
  end

  def call(conn, inputs) do
    if has_permissions?(me(conn), inputs.space_id) do
      people = load_members(inputs, inputs.space_id, company(conn))
      {:ok, %{people: Serializer.serialize(people)}}
    else
      {:ok, %{people: []}}
    end
  end

  defp has_permissions?(person, space_id) do
    from(g in Group, where: g.id == ^space_id)
    |> filter_by_view_access(person.id)
    |> Repo.exists?()
  end

  defp load_members(inputs, space_id, company) do
    limit = inputs[:limit] || 10

    from(p in Person,
      left_join: m in Member, on: p.id == m.person_id and m.group_id == ^space_id,
      where: is_nil(m) and p.company_id == ^company.id and not p.suspended,
      limit: ^limit
    )
    |> exclude_ids(inputs[:exclude_ids])
    |> string_query(inputs[:query])
    |> Repo.all()
  end

  defp exclude_ids(q, nil), do: q
  defp exclude_ids(q, exclude_ids), do: from(p in q, where: p.id not in ^exclude_ids)

  defp string_query(q, nil), do: q
  defp string_query(q, str) do
    from(p in q, where: ilike(p.full_name, ^"%#{str}%") or ilike(p.title, ^"%#{str}%"))
  end
end
