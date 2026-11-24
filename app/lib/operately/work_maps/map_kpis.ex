defmodule Operately.WorkMaps.MapKpis do
  import Ecto.Query
  alias Operately.Access.Filters
  alias Operately.Kpis
  alias Operately.Kpis.Kpi
  alias Operately.Repo

  def search(scope, search) do
    visible(scope)
    |> where([k], fragment("strpos(lower(?), lower(?)) > 0", k.name, ^search))
    |> order_by([k], [k.name, k.id])
    |> limit(50)
    |> load()
  end

  def pinned(_, []), do: []

  def pinned(scope, ids) do
    kpis = visible(scope) |> where([k], k.id in ^ids) |> load() |> Map.new(&{&1.id, &1})
    for id <- ids, kpi = kpis[id], do: kpi
  end

  def visible_ids(scope, ids), do: visible(scope) |> where([k], k.id in ^ids) |> select([k], k.id) |> Repo.all()

  def existing_ids(scope, ids) do
    existing = scoped(scope) |> where([k], k.id in ^ids) |> select([k], k.id) |> Repo.all() |> MapSet.new()
    Enum.filter(ids, &MapSet.member?(existing, &1))
  end

  defp visible(scope), do: Filters.filter_by_view_access(scoped(scope), scope.person.id, named_binding: :space)

  defp scoped(scope) do
    query = from k in Kpi, join: s in assoc(k, :space), as: :space, where: s.company_id == ^scope.person.company_id and is_nil(s.deleted_at)

    if scope.space_id, do: where(query, [k], k.space_id == ^scope.space_id), else: query
  end

  defp load(query) do
    query |> preload([space: s], space: s) |> Repo.all() |> Kpis.load_recent_entries(1)
  end
end
