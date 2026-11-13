defmodule OperatelyWeb.Mcp.Tools.Kpis.ListKpisTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.ListKpis
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    Map.merge(ctx, %{kpi: kpi})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{kpis: [kpi]}} = ListKpis.call(ToolConnHelper.conn(ctx), %{"space_id" => Paths.space_id(ctx.space)})
    assert kpi.id == Paths.kpi_id(ctx.kpi)
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"space_id" => Paths.space_id(ctx.space)} |> Map.put("space_id", "invalid-%%")
    assert {:error, :invalid_arguments} = ListKpis.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = ListKpis.call(ToolConnHelper.conn(other), %{"space_id" => Paths.space_id(ctx.space)})
  end
end
