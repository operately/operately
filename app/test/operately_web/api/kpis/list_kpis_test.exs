defmodule OperatelyWeb.Api.Kpis.ListKpisTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:kpis, :list_kpis], %{})
    end
  end

  describe "list_kpis" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:member, :space)
      |> Factory.add_space_member(:champion, :space)
      |> Factory.add_company_member(:outsider)
    end

    test "a space member can list the KPIs of the space", ctx do
      k1 = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "Revenue")
      k2 = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "Churn")

      ctx = Factory.log_in_person(ctx, :member)
      assert {200, res} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})

      ids = Enum.map(res.kpis, & &1.id)
      assert Paths.kpi_id(k1) in ids
      assert Paths.kpi_id(k2) in ids
    end

    test "a KPI reflects a just-logged entry (no stale 'no data' state)", ctx do
      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "Revenue")

      ctx = Factory.log_in_person(ctx, :member)

      # Log a value the same way the UI does, then re-fetch the list.
      log_inputs = %{kpi_id: Paths.kpi_id(kpi), value: 42.0, period: "2026-01-01"}
      assert {200, _} = mutation(ctx.conn, [:kpis, :log_kpi_entry], log_inputs)

      assert {200, res} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})

      listed = Enum.find(res.kpis, &(&1.id == Paths.kpi_id(kpi)))
      assert [entry] = listed.entries
      assert entry.value == 42.0
    end

    test "entries are returned oldest -> newest so the list can compute latest value / trend", ctx do
      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "Revenue")

      kpi_entry_fixture(ctx.member, kpi, value: 3.0, period: ~D[2026-03-01])
      kpi_entry_fixture(ctx.member, kpi, value: 1.0, period: ~D[2026-01-01])
      kpi_entry_fixture(ctx.member, kpi, value: 2.0, period: ~D[2026-02-01])

      ctx = Factory.log_in_person(ctx, :member)
      assert {200, res} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})

      listed = Enum.find(res.kpis, &(&1.id == Paths.kpi_id(kpi)))
      assert Enum.map(listed.entries, & &1.period) == ["2026-01-01", "2026-02-01", "2026-03-01"]
    end

    test "a non-space-member cannot list the KPIs", ctx do
      kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id)

      ctx = Factory.log_in_person(ctx, :outsider)
      assert {404, _} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})
    end
  end
end
