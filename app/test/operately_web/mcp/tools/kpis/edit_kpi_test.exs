defmodule OperatelyWeb.Mcp.Tools.Kpis.EditKpiTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.EditKpi
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    Map.merge(ctx, %{kpi: kpi})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{kpi: kpi}} = EditKpi.call(ToolConnHelper.conn(ctx), %{"kpi_id" => Paths.kpi_id(ctx.kpi), "name" => "Revenue", "champion_id" => nil})
    assert kpi.name == "Revenue"
    assert kpi.unit == ctx.kpi.unit
    assert is_nil(Operately.Repo.reload!(ctx.kpi).champion_id)
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"kpi_id" => Paths.kpi_id(ctx.kpi), "name" => "Revenue", "champion_id" => nil} |> Map.put("kpi_id", "invalid-%%")
    assert {:error, :invalid_arguments} = EditKpi.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = EditKpi.call(ToolConnHelper.conn(other), %{"kpi_id" => Paths.kpi_id(ctx.kpi), "name" => "Revenue", "champion_id" => nil})
  end
end
