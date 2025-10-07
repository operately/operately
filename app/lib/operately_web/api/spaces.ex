defmodule OperatelyWeb.Api.Spaces do
  alias Operately.Groups.Group, as: Space
  alias OperatelyWeb.Api.Serializer

  defmodule Search do
    use TurboConnect.Query

    inputs do
      field :query, :string, null: false
    end

    outputs do
      field :spaces, list_of(:space), null: false
    end

    def call(conn, inputs) do
      spaces = Space.search(conn.assigns.current_person, inputs.query)

      {:ok, %{spaces: Serializer.serialize(spaces, level: :essential)}}
    end
  end

  defmodule ListMembers do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    import Ecto.Query, only: [from: 2]
    import Operately.Access.Filters, only: [filter_by_view_access: 2]

    alias Operately.Groups.{Group, Member}
    alias Operately.People.Person
    alias Operately.Repo

    inputs do
      field :space_id, :id, null: false
      field? :query, :string, null: true
      field? :ignored_ids, list_of(:id), null: true
    end

    outputs do
      field :people, list_of(:person), null: true
    end

    def call(conn, inputs) do
      person = me(conn)

      if has_permissions?(person, inputs.space_id) do
        inputs
        |> load_members()
        |> Serializer.serialize(level: :essential)
        |> then(&{:ok, %{people: &1}})
      else
        {:ok, %{people: []}}
      end
    end

    defp has_permissions?(person, space_id) do
      from(g in Group, where: g.id == ^space_id)
      |> filter_by_view_access(person.id)
      |> Repo.exists?()
    end

    defp load_members(inputs) do
      inputs
      |> build_query()
      |> Repo.all()
    end

    defp build_query(inputs) do
      from(p in Person,
        join: m in Member,
        on: m.person_id == p.id,
        where: m.group_id == ^inputs.space_id,
        where: p.suspended == false,
        order_by: [asc: p.full_name]
      )
      |> maybe_filter_query(inputs[:query])
      |> maybe_ignore_ids(inputs[:ignored_ids])
    end

    defp maybe_filter_query(query, nil), do: query
    defp maybe_filter_query(query, ""), do: query

    defp maybe_filter_query(query, search) do
      from(p in query, where: ilike(p.full_name, ^"%#{search}%") or ilike(p.title, ^"%#{search}%"))
    end

    defp maybe_ignore_ids(query, nil), do: query
    defp maybe_ignore_ids(query, []), do: query

    defp maybe_ignore_ids(query, ids) do
      from(p in query, where: p.id not in ^ids)
    end
  end
end
