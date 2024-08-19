defmodule Operately.Access.Fetch do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access.Binding

  def get_resource_with_access_level(query, person_id) do
    query = join_resources(query, person_id)

    from([resource: r, binding: b] in query,
      where: b.access_level >= ^Binding.view_access(),
      group_by: r.id,
      select: {r, max(b.access_level)}
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      {r, level} -> {:ok, apply(r, r.__struct__.set_requester_access_level(level))}
    end
  end

  def get_access_level(query, person_id) do
    query = join_resources(query, person_id)

    from([binding: b] in query,
      where: b.access_level >= ^Binding.view_access(),
      select: max(b.access_level)
    )
    |> Repo.one()
    |> case do
      nil -> Binding.no_access()
      level -> level
    end
  end

  defp join_resources(query, person_id) do
    from([resource: r] in query,
      join: c in assoc(r, :access_context),
      join: b in assoc(c, :bindings), as: :binding,
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      where: m.person_id == ^person_id and is_nil(p.suspended_at)
    )
  end
end
