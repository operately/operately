defmodule OperatelyWeb.Api.Kpis.DeleteKpiTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :delete_kpi], %{})
    end
  end

  describe "delete_kpi" do
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

    test "any space member (not only the champion) can delete a KPI", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {200, _} = mutation(ctx.conn, [:kpis, :delete_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})
      assert Kpis.get_kpi(ctx.kpi.id) == nil
    end

    test "a non-space-member cannot delete a KPI", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      assert {404, _} = mutation(ctx.conn, [:kpis, :delete_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})
      assert Kpis.get_kpi(ctx.kpi.id) != nil
    end
  end
end
