defmodule OperatelyWeb.Mcp.Tools.Kpis.DeleteKpiAnnotationTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.DeleteKpiAnnotation
  alias OperatelyWeb.Mcp.ToolConnHelper

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    annotation = kpi_annotation_fixture(ctx.creator, kpi)
    Map.merge(ctx, %{kpi: kpi, annotation: annotation})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{annotation: _annotation}} = DeleteKpiAnnotation.call(ToolConnHelper.conn(ctx), %{"annotation_id" => Operately.ShortUuid.encode!(ctx.annotation.id)})
    assert Operately.Kpis.list_annotations(ctx.kpi.id) == []
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"annotation_id" => Operately.ShortUuid.encode!(ctx.annotation.id)} |> Map.put("annotation_id", "invalid-%%")
    assert {:error, :invalid_arguments} = DeleteKpiAnnotation.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = DeleteKpiAnnotation.call(ToolConnHelper.conn(other), %{"annotation_id" => Operately.ShortUuid.encode!(ctx.annotation.id)})
  end
end
