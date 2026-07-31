defmodule OperatelyWeb.Api.Kpis.EditKpiTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :edit_kpi], %{})
    end
  end

  describe "edit_kpi" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member, :space)
        |> Factory.add_space_member(:champion, :space)
        |> Factory.add_company_member(:outsider)

      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id)
      Map.put(ctx, :kpi, kpi)
    end

    test "any space member (not only the champion) can edit a KPI", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), name: "Renamed", unit: "%"}
      assert {200, res} = mutation(ctx.conn, [:kpis, :edit_kpi], inputs)

      assert res.kpi.name == "Renamed"
      assert Kpis.get_kpi(ctx.kpi.id).name == "Renamed"
      assert Kpis.get_kpi(ctx.kpi.id).unit == "%"
    end

    test "a non-space-member cannot edit a KPI", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), name: "Renamed"}
      assert {404, _} = mutation(ctx.conn, [:kpis, :edit_kpi], inputs)
      assert Kpis.get_kpi(ctx.kpi.id).name == ctx.kpi.name
    end
  end
end
