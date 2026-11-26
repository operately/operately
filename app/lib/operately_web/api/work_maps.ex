defmodule OperatelyWeb.Api.WorkMaps do
  alias Operately.WorkMaps.MapKpis
  alias Operately.WorkMaps.WorkMapKpi
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.WorkMaps
  alias OperatelyWeb.Paths

  defmodule GetSettings do
    @moduledoc "Reads the shared settings visible on the company or space Work Map."
    use TurboConnect.Query

    inputs do
      field? :space_id, :id, null: false
      field? :include_pinned_kpis, :boolean, null: false
    end

    outputs do
      field :can_edit, :boolean, null: false
      field :reparentable_item_ids, list_of(:id), null: false
      field :reviewer_editable_item_ids, list_of(:id), null: false
      field :default_view, :work_map_default_view, null: true
      field :ordered_item_ids, list_of(:id), null: false
      field :pinned_kpis, list_of(:work_map_kpi), null: false
    end

    def call(conn, inputs) do
      with {:ok, scope} <- WorkMaps.Scope.resolve(conn, inputs[:space_id]) do
        settings = WorkMaps.Settings.read(scope, Map.get(inputs, :include_pinned_kpis, true))
        permissions = WorkMaps.ItemPermissions.read(scope, OperatelyWeb.Api.Helpers.company_read_only(conn))

        {:ok,
         %{
           can_edit: scope.can_edit,
           reparentable_item_ids: permissions.reparentable,
           reviewer_editable_item_ids: permissions.reviewer_editable,
           default_view: settings.default_view,
           ordered_item_ids: Enum.map(settings.ordered_items, &WorkMaps.item_id/1),
           pinned_kpis: Serializer.serialize(WorkMapKpi.from_kpi(settings.pinned_kpis))
         }}
      end
    end
  end

  defmodule SaveLayoutAndHierarchy do
    @moduledoc """
    Saves a company or space Work Map's default view, sibling order, KPI pins, and parent changes.
    Parent changes affect every map and are saved atomically with the rest.

    Send only the fields being changed. The last successful save wins for each supplied
    field and each moved item. Omitted fields keep their current values.
    """
    use TurboConnect.Mutation

    import WorkMaps.ParentChanges, only: [apply_parent_changes: 3]

    inputs do
      field? :space_id, :id, null: false
      field? :default_view, :work_map_default_view, null: true
      field? :ordered_item_ids, list_of(:id), null: false
      field? :pinned_kpi_ids, list_of(:id), null: false
      field? :parent_changes, list_of(:work_map_parent_change), null: false
    end

    outputs do
      field :success, :boolean, null: false
    end

    def call(conn, inputs) do
      with {:ok, scope} <- WorkMaps.Scope.resolve(conn, inputs[:space_id]),
           moves = Map.get(inputs, :parent_changes, []),
           {:ok, _settings} <- WorkMaps.Settings.save(scope, inputs, fn -> apply_parent_changes(conn, scope, moves) end) do
        project_ids = for %{type: :project, item_id: id} <- moves, do: id
        OperatelyWeb.Api.Subscriptions.ProjectUpdated.broadcast_result({:ok, %{success: true}}, project_ids)
      end
    end
  end

  defmodule GetKpiPins do
    @moduledoc "Reads visible KPI pins in saved order and fills remaining slots with the newest visible unpinned KPIs."
    use TurboConnect.Query

    inputs do
      field? :space_id, :id, null: false
    end

    outputs do
      field :kpis, list_of(:work_map_kpi), null: false
      field :latest_kpis, list_of(:work_map_kpi), null: false
      field :has_kpis, :boolean, null: false
      field :pin_limit, :integer, null: false
    end

    def call(conn, inputs) do
      with {:ok, scope} <- WorkMaps.Scope.resolve(conn, inputs[:space_id]) do
        %{pins: pins, latest: latest, pin_limit: limit} = WorkMaps.Settings.read_pins(scope)

        {:ok,
         %{
           kpis: Serializer.serialize(WorkMapKpi.from_kpi(pins)),
           latest_kpis: Serializer.serialize(WorkMapKpi.from_kpi(latest)),
           pin_limit: limit,
           has_kpis: pins != [] or latest != []
         }}
      end
    end
  end

  defmodule SearchKpis do
    @moduledoc "Searches visible KPIs for the Work Map pin picker."
    use TurboConnect.Query

    inputs do
      field? :space_id, :id, null: false
      field? :query, :string, null: false
      field? :offset, :integer, null: false
    end

    outputs do
      field :kpis, list_of(:work_map_kpi), null: false
      field :has_more, :boolean, null: false
    end

    def call(conn, inputs) do
      with {:ok, scope} <- WorkMaps.Scope.resolve(conn, inputs[:space_id]) do
        {kpis, has_more} = MapKpis.search(scope, String.trim(Map.get(inputs, :query, "")), max(Map.get(inputs, :offset, 0), 0))

        {:ok,
         %{
           kpis: Serializer.serialize(WorkMapKpi.from_kpi(kpis)),
           has_more: has_more
         }}
      end
    end
  end

  def item_id(%Operately.Goals.Goal{} = goal), do: Paths.goal_id(goal)
  def item_id(%Operately.Projects.Project{} = project), do: Paths.project_id(project)
end
