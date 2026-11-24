defmodule OperatelyWeb.Api.WorkMaps.GetSettingsTest do
  use OperatelyWeb.TurboCase
  alias Operately.Access.Binding

  test "new maps start with the built-in view and hide private references in shared filters", ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:private, company_permissions: Binding.no_access())
      |> Factory.add_company_member(:viewer)
      |> Factory.log_in_person(:creator)

    space_scope = %{space_id: Paths.space_id(ctx.private)}
    for scope <- [%{}, space_scope] do
      assert {200, %{default_view: nil, ordered_item_ids: [], pinned_kpis: []}} = query(ctx.conn, [:work_maps, :get_settings], scope)
    end

    filter = %{field: "space", operator: "is", values: [Paths.space_id(ctx.private)]}
    attrs = %{default_view: %{view: "timeline", filters: [filter]}}
    assert {200, _} = mutation(ctx.conn, [:work_maps, :save_layout_and_hierarchy], attrs)

    id = Paths.space_id(ctx.private.id)
    assert {200, %{default_view: %{view: "timeline", filters: [%{values: [^id]}]}}} = query(ctx.conn, [:work_maps, :get_settings], %{})
    assert {200, %{default_view: nil}} = query(ctx.conn, [:work_maps, :get_settings], space_scope)

    viewer = Factory.log_in_person(ctx, :viewer)
    assert {200, %{default_view: %{filters: [%{values: []}]}}} = query(viewer.conn, [:work_maps, :get_settings], %{})
    assert {404, _} = query(viewer.conn, [:work_maps, :get_settings], space_scope)
  end
end
