defmodule OperatelyWeb.Api.Kpis.CreateKpiTest do
  use OperatelyWeb.TurboCase

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :create_kpi], %{})
    end
  end

  describe "create_kpi" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:member, :space)
      |> Factory.add_space_member(:champion, :space)
      |> Factory.add_company_member(:outsider)
    end

    test "any space member (not only the champion) can create a KPI", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      description = %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}

      inputs = %{
        space_id: Paths.space_id(ctx.space),
        name: "Revenue",
        unit: "$",
        cadence: "monthly",
        champion_id: Paths.person_id(ctx.champion),
        description: Jason.encode!(description)
      }

      assert {200, res} = mutation(ctx.conn, [:kpis, :create_kpi], inputs)
      assert res.kpi.name == "Revenue"
      assert Jason.decode!(res.kpi.description) == description

      assert [kpi] = Kpis.list_kpis(ctx.space.id)
      assert kpi.name == "Revenue"
      assert kpi.champion_id == ctx.champion.id
      assert kpi.description == description
    end

    test "a non-space-member cannot create a KPI", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{space_id: Paths.space_id(ctx.space), name: "Revenue", unit: "$", cadence: "monthly"}

      assert {404, _} = mutation(ctx.conn, [:kpis, :create_kpi], inputs)
      assert Kpis.list_kpis(ctx.space.id) == []
    end
  end
end
