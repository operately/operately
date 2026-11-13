defmodule OperatelyWeb.Mcp.Tools.Kpis.DeleteKpiTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.DeleteKpi
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    Map.merge(ctx, %{kpi: kpi})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{kpi: _kpi}} = DeleteKpi.call(ToolConnHelper.conn(ctx), %{"kpi_id" => Paths.kpi_id(ctx.kpi)})
    assert is_nil(Operately.Kpis.get_kpi(ctx.kpi.id))
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"kpi_id" => Paths.kpi_id(ctx.kpi)} |> Map.put("kpi_id", "invalid-%%")
    assert {:error, :invalid_arguments} = DeleteKpi.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = DeleteKpi.call(ToolConnHelper.conn(other), %{"kpi_id" => Paths.kpi_id(ctx.kpi)})
  end
end
