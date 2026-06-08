defmodule Operately.Access.Fetch do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access.Binding

  def get_resource_with_access_level(query, person_id) do
    get_resource_with_access_level(query, person_id, [])
  end

  def get_resource_with_access_level(query, person_id, opts) do
    selected_resource = Keyword.get(opts, :selected_resource, :resource)
    query = join_access_level(query, person_id, opts)

    from([{^selected_resource, r}, binding: b] in query,
      where: b.access_level >= ^Binding.view_access(),
      group_by: r.id,
      select: {r, max(b.access_level)}
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      {r, level} -> {:ok, apply(r.__struct__, :set_requester_access_level, [r, level])}
    end
  end

  def get_access_level(query, person_id) do
    get_access_level(query, person_id, [])
  end

  def get_access_level(query, person_id, opts) do
    query = join_access_level(query, person_id, opts)

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

  def join_access_level(query, person_id) do
    join_access_level(query, person_id, [])
  end

  def join_access_level(query, person_id, opts) do
    case Keyword.get(opts, :resource_hub_source) do
      nil ->
        from([resource: r] in query,
          join: c in assoc(r, :access_context),
          join: b in assoc(c, :bindings),
          as: :binding,
          join: g in assoc(b, :group),
          join: m in assoc(g, :memberships),
          join: p in assoc(m, :person),
          where: b.access_level >= ^Binding.view_access(),
          where: m.person_id == ^person_id and is_nil(p.suspended_at)
        )

      source ->
        query
        |> Operately.ResourceHubs.Getter.join_effective_context(source)
        |> join_bindings(person_id)
    end
  end

  defp join_bindings(query, person_id) do
    from([context: c] in query,
      join: b in assoc(c, :bindings),
      as: :binding,
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      where: b.access_level >= ^Binding.view_access(),
      where: m.person_id == ^person_id and is_nil(p.suspended_at)
    )
  end
end
