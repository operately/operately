defmodule OperatelyWeb.Api.WorkMaps.Settings do
  import Ecto.Changeset, only: [change: 2]
  import Ecto.Query

  alias Operately.Access.Filters
  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.WorkMaps.MapKpis
  alias Operately.WorkMaps.Settings, as: MapSettings
  alias OperatelyWeb.Api.WorkMaps.DefaultView

  @layout_fields [:default_view, :ordered_item_ids, :pinned_kpi_ids]
  @max_pinned_kpis 3

  def read(scope, include_pins \\ true) do
    settings = Repo.get_by(MapSettings, owner_key(scope)) || %MapSettings{}

    %{
      default_view: DefaultView.for_read(settings.default_view, scope),
      ordered_items: ordered_visible_items(scope, settings.ordered_item_ids),
      pinned_kpis: if(include_pins, do: MapKpis.pinned(scope, settings.pinned_kpi_ids), else: [])
    }
  end

  def read_pins(scope) do
    settings = Repo.get_by(MapSettings, owner_key(scope))
    ids = if settings, do: settings.pinned_kpi_ids, else: []

    pins = MapKpis.pinned(scope, ids)
    hidden = if length(pins) == length(ids), do: 0, else: length(MapKpis.existing_ids(scope, ids)) - length(pins)

    latest = MapKpis.latest_unpinned(scope, ids, @max_pinned_kpis - length(pins))
    %{pins: pins, latest: latest, pin_limit: @max_pinned_kpis - hidden}
  end

  def save(%{can_edit: false}, _attrs, _apply_moves), do: {:error, :forbidden}

  def save(scope, attrs, apply_moves) do
    Repo.transaction(fn ->
      settings = lock_settings(scope)
      changes = layout_changes(scope, settings, attrs)

      if changes == %{} and attrs[:parent_changes] in [nil, []], do: Repo.rollback(:bad_request)

      case apply_moves.() do
        :ok -> settings |> change(changes) |> Repo.update!()
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp owner_key(%{space_id: nil, person: person}), do: [company_id: person.company_id]
  defp owner_key(%{space_id: id}), do: [space_id: id]

  defp lock_settings(scope) do
    key = owner_key(scope)
    # Two editors can both be the first to save this map.
    Repo.insert!(struct!(MapSettings, key), on_conflict: :nothing)
    Repo.one!(from s in MapSettings, where: ^key, lock: "FOR UPDATE")
  end

  defp layout_changes(scope, settings, attrs) do
    attrs
    |> Map.take(@layout_fields)
    |> Map.new(fn
      {:default_view, view} -> {:default_view, DefaultView.for_save(view, scope)}
      {:ordered_item_ids, ids} -> {:ordered_item_ids, reorder_items(scope, settings.ordered_item_ids, ids)}
      {:pinned_kpi_ids, ids} -> {:pinned_kpi_ids, reorder_pins(scope, settings.pinned_kpi_ids, ids)}
    end)
  end

  defp reorder_items(scope, saved_ids, requested_ids) do
    visible_items = visible_items_by_id(scope, Enum.uniq(saved_ids ++ requested_ids))
    merge_visible_order(saved_ids, requested_ids, Map.keys(visible_items))
  end

  defp reorder_pins(scope, saved_ids, requested_ids) do
    existing_ids = MapKpis.existing_ids(scope, saved_ids)
    visible_ids = MapKpis.visible_ids(scope, Enum.uniq(existing_ids ++ requested_ids))
    pins = merge_visible_order(existing_ids, requested_ids, visible_ids)

    if length(pins) > @max_pinned_kpis, do: Repo.rollback(:bad_request)
    pins
  end

  defp merge_visible_order(saved_ids, requested_ids, visible_ids) do
    visible = MapSet.new(visible_ids)
    requested = MapSet.new(requested_ids)

    if MapSet.size(requested) != length(requested_ids) or not MapSet.subset?(requested, visible) do
      Repo.rollback(:bad_request)
    end

    fill_visible_slots(saved_ids, requested_ids, visible)
  end

  # With B hidden, reordering [A, B, C] to [C, A, D] produces [C, B, A, D].
  defp fill_visible_slots([], remaining, _visible), do: remaining
  defp fill_visible_slots(saved, [], visible), do: Enum.reject(saved, &MapSet.member?(visible, &1))

  defp fill_visible_slots([id | saved], [next | rest] = requested, visible) do
    if MapSet.member?(visible, id) do
      [next | fill_visible_slots(saved, rest, visible)]
    else
      [id | fill_visible_slots(saved, requested, visible)]
    end
  end

  defp ordered_visible_items(scope, ids) do
    items = visible_items_by_id(scope, ids)
    ids |> Enum.map(&Map.get(items, &1)) |> Enum.reject(&is_nil/1)
  end

  defp visible_items_by_id(_, []), do: %{}

  defp visible_items_by_id(scope, ids) do
    goals = visible_items(Goal, scope, ids)
    projects = visible_items(Project, scope, ids)
    Map.new(goals ++ projects, &{&1.id, &1})
  end

  defp visible_items(schema, scope, ids) do
    query =
      from item in schema,
        where: item.company_id == ^scope.person.company_id and item.id in ^ids,
        select: struct(item, [:id, :name])

    query = if scope.space_id, do: where(query, [item], item.group_id == ^scope.space_id), else: query

    query
    |> Filters.filter_by_view_access(scope.person.id)
    |> Repo.all()
  end
end
