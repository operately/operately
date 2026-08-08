defmodule OperatelyWeb.Api.Kpis.GetKpiTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:kpis, :get_kpi], %{})
    end
  end

  describe "get_kpi" do
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

    test "a space member can get a KPI with its entries ordered by period for charting", ctx do
      # Log entries out of order to prove the API returns them sorted.
      kpi_entry_fixture(ctx.member, ctx.kpi, value: 3.0, period: ~D[2026-03-01])
      kpi_entry_fixture(ctx.member, ctx.kpi, value: 1.0, period: ~D[2026-01-01])
      kpi_entry_fixture(ctx.member, ctx.kpi, value: 2.0, period: ~D[2026-02-01])

      ctx = Factory.log_in_person(ctx, :member)
      assert {200, res} = query(ctx.conn, [:kpis, :get_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})

      assert res.kpi.id == Paths.kpi_id(ctx.kpi)
      periods = Enum.map(res.kpi.entries, & &1.period)
      assert periods == ["2026-01-01", "2026-02-01", "2026-03-01"]
    end

    test "includes potential subscribers so the detail view can show who receives notifications", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {200, res} = query(ctx.conn, [:kpis, :get_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})

      assert res.kpi.subscription_list != nil
      assert length(res.kpi.potential_subscribers) >= 2

      champion =
        res.kpi.potential_subscribers
        |> Enum.find(&(&1.person.id == Paths.person_id(ctx.champion)))

      assert champion.is_subscribed == true
      assert champion.role == "Champion"
    end

    test "a non-space-member cannot get a KPI", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)
      assert {404, _} = query(ctx.conn, [:kpis, :get_kpi], %{kpi_id: Paths.kpi_id(ctx.kpi)})
    end
  end
end
