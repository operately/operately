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

    test "a non-space-member cannot list the KPIs", ctx do
      kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.champion.id)

      ctx = Factory.log_in_person(ctx, :outsider)
      assert {404, _} = query(ctx.conn, [:kpis, :list_kpis], %{space_id: Paths.space_id(ctx.space)})
    end
  end
end
