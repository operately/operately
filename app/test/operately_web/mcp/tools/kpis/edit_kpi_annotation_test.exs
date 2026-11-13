defmodule OperatelyWeb.Mcp.Tools.Kpis.EditKpiAnnotationTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.EditKpiAnnotation
  alias OperatelyWeb.Mcp.ToolConnHelper

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    annotation = kpi_annotation_fixture(ctx.creator, kpi)
    Map.merge(ctx, %{kpi: kpi, annotation: annotation})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{annotation: annotation}} = EditKpiAnnotation.call(ToolConnHelper.conn(ctx), %{"annotation_id" => Operately.ShortUuid.encode!(ctx.annotation.id), "title" => "Launch"})
    assert annotation.title == "Launch"
    assert annotation.date == "2026-03-15"
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"annotation_id" => Operately.ShortUuid.encode!(ctx.annotation.id), "title" => "Launch"} |> Map.put("annotation_id", "invalid-%%")
    assert {:error, :invalid_arguments} = EditKpiAnnotation.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = EditKpiAnnotation.call(ToolConnHelper.conn(other), %{"annotation_id" => Operately.ShortUuid.encode!(ctx.annotation.id), "title" => "Launch"})
  end
end
