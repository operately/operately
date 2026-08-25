defmodule OperatelyWeb.Api.Kpis.EditKpiAnnotationTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], %{})
    end
  end

  describe "edit_kpi_annotation" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member, :space)
        |> Factory.add_company_member(:outsider)

      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
      annotation = kpi_annotation_fixture(ctx.creator, kpi)
      ctx |> Map.put(:kpi, kpi) |> Map.put(:annotation, annotation)
    end

    test "any space member can edit an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{
        annotation_id: Paths.kpi_annotation_id(ctx.annotation),
        title: "Pricing change",
        date: "2026-04-01"
      }

      assert {200, res} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], inputs)
      assert res.annotation.title == "Pricing change"
      assert res.annotation.date == "2026-04-01"
      assert Kpis.get_annotation(ctx.annotation.id).title == "Pricing change"
    end

    test "a non-space-member cannot edit an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{annotation_id: Paths.kpi_annotation_id(ctx.annotation), title: "Pricing change"}
      assert {404, _} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], inputs)
      assert Kpis.get_annotation(ctx.annotation.id).title == ctx.annotation.title
    end
  end
end
