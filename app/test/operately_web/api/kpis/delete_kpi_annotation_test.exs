defmodule OperatelyWeb.Api.Kpis.DeleteKpiAnnotationTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures

  alias Operately.Kpis

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :delete_kpi_annotation], %{})
    end
  end

  describe "delete_kpi_annotation" do
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

    test "any space member can delete an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{annotation_id: Paths.kpi_annotation_id(ctx.annotation)}
      assert {200, res} = mutation(ctx.conn, [:kpis, :delete_kpi_annotation], inputs)
      assert res.annotation.id == Paths.kpi_annotation_id(ctx.annotation)
      assert Kpis.list_annotations(ctx.kpi.id) == []
    end

    test "a non-space-member cannot delete an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{annotation_id: Paths.kpi_annotation_id(ctx.annotation)}
      assert {404, _} = mutation(ctx.conn, [:kpis, :delete_kpi_annotation], inputs)
      assert length(Kpis.list_annotations(ctx.kpi.id)) == 1
    end
  end
end
