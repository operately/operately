defmodule OperatelyWeb.Mcp.Tools.Spaces.UpdateTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.Update
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{space: space}} =
             Update.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "Updated MCP Space",
               "mission" => "Updated mission"
             })

    assert space.name == "Updated MCP Space"

    space = ToolConnHelper.reload(ctx.space)

    assert space.name == "Updated MCP Space"
    assert space.mission == "Updated mission"
  end
end
