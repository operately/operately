defmodule OperatelyWeb.Api.WorkMaps.GetKpiPinsTest do
  use OperatelyWeb.TurboCase
  import Operately.KpisFixtures
  alias Operately.Access.Binding

  test "revoking private space access removes its readings from the company map", ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: Binding.no_access())
      |> Factory.add_space_member(:viewer, :space, permissions: :view_access)
      |> Factory.log_in_person(:creator)

    kpi = kpi_fixture(ctx.creator, %{space_id: ctx.space.id})
    kpi_entry_fixture(ctx.creator, kpi, %{period: ~D[2026-11-09], value: 10.0})
    kpi_entry_fixture(ctx.creator, kpi, %{period: ~D[2026-11-16], value: 0.0})

    id = Paths.kpi_id(kpi)
    viewer = Factory.log_in_person(ctx, :viewer)
    assert {200, %{kpis: [], has_kpis: true}} = query(viewer.conn, [:work_maps, :get_kpi_pins], %{})
    assert {200, _} = mutation(ctx.conn, [:work_maps, :save_layout_and_hierarchy], %{pinned_kpi_ids: [id]})
    assert {200, %{kpis: [%{id: ^id} = pin]}} = query(viewer.conn, [:work_maps, :get_kpi_pins], %{})
    assert pin.value == 0.0
    assert pin.recent_values == [10.0, 0.0]

    {:ok, _} = Operately.Operations.GroupMemberRemoving.run(ctx.creator, ctx.space, ctx.viewer.id)
    assert {200, %{kpis: [], has_kpis: false, pin_limit: 2}} = query(viewer.conn, [:work_maps, :get_kpi_pins], %{})
  end
end
