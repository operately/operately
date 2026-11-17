defmodule OperatelyWeb.Mcp.Tools.Kpis.LogKpiEntryTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.LogKpiEntry
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    Map.merge(ctx, %{kpi: kpi})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{entry: entry}} = LogKpiEntry.call(ToolConnHelper.conn(ctx), %{"kpi_id" => Paths.kpi_id(ctx.kpi), "value" => 75.5, "period" => "2026-02-01"})
    assert entry.value == 75.5
    assert entry.period == "2026-02-01"
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"kpi_id" => Paths.kpi_id(ctx.kpi), "value" => 75.5, "period" => "2026-02-01"} |> Map.put("kpi_id", "invalid-%%")
    assert {:error, :invalid_arguments} = LogKpiEntry.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = LogKpiEntry.call(ToolConnHelper.conn(other), %{"kpi_id" => Paths.kpi_id(ctx.kpi), "value" => 75.5, "period" => "2026-02-01"})
  end
end
