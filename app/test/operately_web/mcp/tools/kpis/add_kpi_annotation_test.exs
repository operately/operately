defmodule OperatelyWeb.Mcp.Tools.Kpis.AddKpiAnnotationTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.AddKpiAnnotation
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    Map.merge(ctx, %{kpi: kpi})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{annotation: annotation}} = AddKpiAnnotation.call(ToolConnHelper.conn(ctx), %{"kpi_id" => Paths.kpi_id(ctx.kpi), "date" => "2026-02-01", "title" => "Launch"})
    assert annotation.title == "Launch"
    assert annotation.date == "2026-02-01"
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"kpi_id" => Paths.kpi_id(ctx.kpi), "date" => "2026-02-01", "title" => "Launch"} |> Map.put("kpi_id", "invalid-%%")
    assert {:error, :invalid_arguments} = AddKpiAnnotation.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = AddKpiAnnotation.call(ToolConnHelper.conn(other), %{"kpi_id" => Paths.kpi_id(ctx.kpi), "date" => "2026-02-01", "title" => "Launch"})
  end
end
