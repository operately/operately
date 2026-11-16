defmodule OperatelyWeb.Mcp.Tools.Companies.GetWorkMapTest do
  use Operately.DataCase

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Companies.GetWorkMap, as: Tool
  alias OperatelyWeb.Paths

  test "returns accessible work and respects resource filters" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    args = %{"space_id" => Paths.space_id(ctx.space), "include_assignees" => true, "include_reviewer" => true}
    assert {:ok, %{work_map: items}} = Tool.call(ToolConnHelper.conn(ctx), args)
    assert Enum.any?(items, &(&1.id == Paths.project_id(ctx.project)))
    assert {:ok, %{work_map: []}} = Tool.call(ToolConnHelper.conn(Factory.setup(%{})), args)
    assert {:error, :invalid_arguments} = Tool.call(ToolConnHelper.conn(ctx), %{"space_id" => "invalid-%%"})
  end
end
