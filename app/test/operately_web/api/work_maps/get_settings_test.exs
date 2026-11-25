defmodule OperatelyWeb.Api.WorkMaps.GetSettingsTest do
  use OperatelyWeb.TurboCase
  alias Operately.Access.Binding

  test "a space editor can reparent editable items and change reviewers only with full item access", ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space(:other)
      |> Factory.add_space_member(:editor, :space, permissions: :edit_access)
      |> Factory.add_goal(:editable, :space, space_access: Binding.edit_access())
      |> Factory.add_project(:managed, :space, champion: :editor)
      |> Factory.add_project(:view_only, :space, company_access_level: Binding.view_access(), space_access_level: Binding.view_access())
      |> Factory.add_project(:elsewhere, :other, champion: :editor)
      |> Factory.log_in_person(:editor)

    assert {200, result} = query(ctx.conn, [:work_maps, :get_settings], %{space_id: Paths.space_id(ctx.space)})
    assert Enum.sort(result.reparentable_item_ids) == Enum.sort([Paths.goal_id(ctx.editable), Paths.project_id(ctx.managed)])
    assert result.reviewer_editable_item_ids == [Paths.project_id(ctx.managed)]
  end

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
