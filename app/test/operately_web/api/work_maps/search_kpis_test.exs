defmodule OperatelyWeb.Api.WorkMaps.SearchKpisTest do
  use OperatelyWeb.TurboCase
  alias Operately.Access.Binding
  import Operately.KpisFixtures

  test "search respects space visibility and returns the latest measurement", ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:public, company_permissions: Binding.view_access())
      |> Factory.add_space(:private, company_permissions: Binding.no_access())
      |> Factory.add_company_member(:viewer)

    kpi = kpi_fixture(ctx.creator, %{space_id: ctx.public.id, name: "Public sales"})
    kpi_fixture(ctx.creator, %{space_id: ctx.private.id, name: "Private sales"})
    kpi_entry_fixture(ctx.creator, kpi, %{value: 19.0})
    id = Paths.kpi_id(kpi)
    viewer = Factory.log_in_person(ctx, :viewer)
    assert {200, %{kpis: [%{id: ^id, value: 19.0}]}} = query(viewer.conn, [:work_maps, :search_kpis], %{query: "SALES"})

    creator = Factory.log_in_person(ctx, :creator)
    assert {200, %{kpis: [%{id: ^id}]}} = query(creator.conn, [:work_maps, :search_kpis], %{space_id: Paths.space_id(ctx.public), query: "sales"})
  end
end
