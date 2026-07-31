defmodule OperatelyWeb.Api.Kpis.LogKpiEntryTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :log_kpi_entry], %{})
    end
  end

  describe "log_kpi_entry" do
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

    test "any space member (not only the champion) can log an entry", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), value: 42.0, period: "2026-01-01"}
      assert {200, res} = mutation(ctx.conn, [:kpis, :log_kpi_entry], inputs)

      assert res.entry.value == 42.0
      assert res.entry.period == "2026-01-01"

      assert [entry] = Kpis.list_entries(ctx.kpi.id)
      assert entry.value == 42.0
      assert entry.recorded_by_id == ctx.member.id
    end

    test "a non-space-member cannot log an entry", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), value: 42.0, period: "2026-01-01"}
      assert {404, _} = mutation(ctx.conn, [:kpis, :log_kpi_entry], inputs)
      assert Kpis.list_entries(ctx.kpi.id) == []
    end
  end
end
