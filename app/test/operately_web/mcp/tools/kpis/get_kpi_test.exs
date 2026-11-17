defmodule OperatelyWeb.Mcp.Tools.Kpis.GetKpiTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.GetKpi
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    entry = kpi_entry_fixture(ctx.creator, kpi)
    annotation = kpi_annotation_fixture(ctx.creator, kpi)
    Map.merge(ctx, %{kpi: kpi, entry: entry, annotation: annotation})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{kpi: kpi}} = GetKpi.call(ToolConnHelper.conn(ctx), %{"kpi_id" => Paths.kpi_id(ctx.kpi)})
    assert length(kpi.entries) == 1
    assert length(kpi.annotations) == 1
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"kpi_id" => Paths.kpi_id(ctx.kpi)} |> Map.put("kpi_id", "invalid-%%")
    assert {:error, :invalid_arguments} = GetKpi.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = GetKpi.call(ToolConnHelper.conn(other), %{"kpi_id" => Paths.kpi_id(ctx.kpi)})
  end
end
