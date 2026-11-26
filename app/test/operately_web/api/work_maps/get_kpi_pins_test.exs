defmodule OperatelyWeb.Api.WorkMaps.GetKpiPinsTest do
  use OperatelyWeb.TurboCase
  import Operately.KpisFixtures
  alias Operately.Access.Binding

  test "maps fill free slots with the newest unpinned KPIs in scope", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_space(:other) |> Factory.log_in_person(:creator)

    [first, second, third, fourth] =
      for {space, day} <- Enum.with_index([ctx.space, ctx.space, ctx.other, ctx.space], 1) do
        ctx.creator
        |> kpi_fixture(%{space_id: space.id})
        |> Ecto.Changeset.change(inserted_at: NaiveDateTime.add(~N[2026-01-01 00:00:00], day, :day))
        |> Operately.Repo.update!()
        |> Paths.kpi_id()
      end

    assert {200, %{kpis: [], latest_kpis: company}} = query(ctx.conn, [:work_maps, :get_kpi_pins], %{})
    assert Enum.map(company, & &1.id) == [fourth, third, second]

    assert {200, %{kpis: [], latest_kpis: space}} = query(ctx.conn, [:work_maps, :get_kpi_pins], %{space_id: Paths.space_id(ctx.space)})
    assert Enum.map(space, & &1.id) == [fourth, second, first]

    for {pins, expected_latest} <- [
          {[fourth], [third, second]},
          {[first, fourth], [third]},
          {[second, first, fourth], []}
        ] do
      assert {200, _} = mutation(ctx.conn, [:work_maps, :save_layout_and_hierarchy], %{pinned_kpi_ids: pins})
      assert {200, %{kpis: saved, latest_kpis: latest}} = query(ctx.conn, [:work_maps, :get_kpi_pins], %{})
      assert Enum.map(saved, & &1.id) == pins
      assert Enum.map(latest, & &1.id) == expected_latest
    end
  end

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
    assert {200, %{kpis: [], latest_kpis: [%{id: ^id} = latest], has_kpis: true}} = query(viewer.conn, [:work_maps, :get_kpi_pins], %{})
    assert latest.recent_values == [10.0, 0.0]
    assert {200, _} = mutation(ctx.conn, [:work_maps, :save_layout_and_hierarchy], %{pinned_kpi_ids: [id]})
    assert {200, %{kpis: [%{id: ^id} = pin], latest_kpis: []}} = query(viewer.conn, [:work_maps, :get_kpi_pins], %{})
    assert pin.value == 0.0
    assert pin.recent_values == [10.0, 0.0]

    {:ok, _} = Operately.Operations.GroupMemberRemoving.run(ctx.creator, ctx.space, ctx.viewer.id)
    assert {200, %{kpis: [], latest_kpis: [], has_kpis: false, pin_limit: 2}} = query(viewer.conn, [:work_maps, :get_kpi_pins], %{})
  end
end
