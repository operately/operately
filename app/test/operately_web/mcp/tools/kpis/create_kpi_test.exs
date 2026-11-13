defmodule OperatelyWeb.Mcp.Tools.Kpis.CreateKpiTest do
  use Operately.DataCase, async: true

  import Operately.KpisFixtures
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Kpis.CreateKpi
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space)
    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    Map.merge(ctx, %{kpi: kpi})
  end

  test "adapts inputs and returns the API result", ctx do
    assert {:ok, %{kpi: kpi}} =
             CreateKpi.call(ToolConnHelper.conn(ctx), %{"space_id" => Paths.space_id(ctx.space), "name" => "Revenue", "unit" => "USD", "cadence" => "weekly", "description" => "**Growth**"})

    assert kpi.name == "Revenue"
    assert kpi.cadence == "weekly"
    assert ToolConnHelper.rich_text_to_string(kpi.description) == "Growth"
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"space_id" => Paths.space_id(ctx.space), "name" => "Revenue", "unit" => "USD", "cadence" => "weekly", "description" => "**Growth**"} |> Map.put("space_id", "invalid-%%")
    assert {:error, :invalid_arguments} = CreateKpi.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "does not expose another company's resource", ctx do
    other = %{} |> Factory.setup()

    assert {:error, :not_found} =
             CreateKpi.call(ToolConnHelper.conn(other), %{"space_id" => Paths.space_id(ctx.space), "name" => "Revenue", "unit" => "USD", "cadence" => "weekly", "description" => "**Growth**"})
  end
end
