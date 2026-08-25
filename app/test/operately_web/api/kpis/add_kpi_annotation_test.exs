defmodule OperatelyWeb.Api.Kpis.AddKpiAnnotationTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], %{})
    end
  end

  describe "add_kpi_annotation" do
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

    test "any space member can add an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{
        kpi_id: Paths.kpi_id(ctx.kpi),
        date: "2026-03-15",
        title: "Launched enterprise plan",
        description: "First paid cohort went live"
      }

      assert {200, res} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], inputs)

      assert res.annotation.title == "Launched enterprise plan"
      assert res.annotation.date == "2026-03-15"
      assert res.annotation.description == "First paid cohort went live"

      assert [annotation] = Kpis.list_annotations(ctx.kpi.id)
      assert annotation.title == "Launched enterprise plan"
      assert annotation.created_by_id == ctx.member.id
    end

    test "a non-space-member cannot add an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{kpi_id: Paths.kpi_id(ctx.kpi), date: "2026-03-15", title: "Launched enterprise plan"}
      assert {404, _} = mutation(ctx.conn, [:kpis, :add_kpi_annotation], inputs)
      assert Kpis.list_annotations(ctx.kpi.id) == []
    end
  end
end
