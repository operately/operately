defmodule OperatelyWeb.Api.Queries.SearchPotentialSpaceMembers do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.People.Person
  alias Operately.Groups.{Group, Member}

  inputs do
    field :group_id, :string
    field :query, :string
    field :exclude_ids, list_of(:string)
    field :limit, :integer
  end

  outputs do
    field :people, list_of(:person)
  end

  def call(conn, inputs) do
    {:ok, space_id} = decode_id(inputs.group_id)

    if check_permissions(me(conn), space_id) do
      people = load_members(inputs, space_id)
      {:ok, %{people: Serializer.serialize(people)}}
    else
      {:ok, %{people: []}}
    end
  end

  defp check_permissions(person, space_id) do
    from(g in Group, where: g.id == ^space_id)
    |> filter_by_view_access(person.id)
    |> Repo.exists?()
  end

  defp load_members(inputs, space_id) do
    limit = inputs[:limit] || 10

    from(p in Person,
      left_join: m in Member, on: p.id == m.person_id and m.group_id == ^space_id,
      where: is_nil(m) and not p.suspended,
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
