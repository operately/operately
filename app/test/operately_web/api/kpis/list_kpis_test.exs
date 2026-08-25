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
      description = %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}
      k1 = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "Revenue", description: description)
      k2 = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "Churn")

      ctx = Factory.log_in_person(ctx, :member)
      assert {200, res} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})

      ids = Enum.map(res.kpis, & &1.id)
      assert Paths.kpi_id(k1) in ids
      assert Paths.kpi_id(k2) in ids

      listed = Enum.find(res.kpis, &(&1.id == Paths.kpi_id(k1)))
      assert Jason.decode!(listed.description) == description
    end

    test "each KPI carries its latest entry (value + period) and its recent history", ctx do
      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "PR Throughput", unit: "USD")

      # Log entries out of order to prove the latest (by period) is returned, and
      # that the history is ordered oldest -> newest for the inline trend line.
      kpi_entry_fixture(ctx.member, kpi, value: 100.0, period: ~D[2026-01-01])
      kpi_entry_fixture(ctx.member, kpi, value: 123.0, period: ~D[2026-03-01])
      kpi_entry_fixture(ctx.member, kpi, value: 110.0, period: ~D[2026-02-01])

      ctx = Factory.log_in_person(ctx, :member)
      assert {200, res} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})

      listed = Enum.find(res.kpis, &(&1.id == Paths.kpi_id(kpi)))
      assert listed.latest_entry.value == 123.0
      assert listed.latest_entry.period == "2026-03-01"

      assert Enum.map(listed.entries, & &1.period) == ["2026-01-01", "2026-02-01", "2026-03-01"]
      assert Enum.map(listed.entries, & &1.value) == [100.0, 110.0, 123.0]
    end

    test "the history of each KPI is capped so the list stays cheap", ctx do
      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "Sign-ups")

      Enum.each(1..15, fn day ->
        kpi_entry_fixture(ctx.member, kpi, value: day * 1.0, period: Date.add(~D[2026-01-01], day))
      end)

      ctx = Factory.log_in_person(ctx, :member)
      assert {200, res} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})

      listed = Enum.find(res.kpis, &(&1.id == Paths.kpi_id(kpi)))

      # The 12 most recent periods, oldest -> newest.
      assert length(listed.entries) == 12
      assert Enum.map(listed.entries, & &1.value) == Enum.map(4..15, &(&1 * 1.0))
      assert listed.latest_entry.value == 15.0
    end

    test "a KPI with no entries has a nil latest entry and no history", ctx do
      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id, name: "Fresh KPI")

      ctx = Factory.log_in_person(ctx, :member)
      assert {200, res} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})

      listed = Enum.find(res.kpis, &(&1.id == Paths.kpi_id(kpi)))
      assert listed.latest_entry == nil
      assert listed.entries == []
    end

    test "a non-space-member cannot list the KPIs", ctx do
      kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id)

      ctx = Factory.log_in_person(ctx, :outsider)
      assert {404, _} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})
    end
  end
end
