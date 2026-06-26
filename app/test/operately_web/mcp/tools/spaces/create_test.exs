defmodule OperatelyWeb.Mcp.Tools.Spaces.CreateTest do
  use Operately.DataCase, async: true

  alias Operately.Groups.Group
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.Create
  alias OperatelyWeb.Mcp.ToolConnHelper

  test "call/2 creates a space" do
    ctx = Factory.setup(%{})

    assert {:ok, %{space: space}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "name" => "MCP Space",
               "mission" => "Own the MCP workflows"
             })

    space = Operately.Repo.get!(Group, ToolConnHelper.decode_id!(space.id))

    assert space.name == "MCP Space"
    assert space.mission == "Own the MCP workflows"
  end
end
