defmodule OperatelyWeb.Mcp.Tools.Spaces.DeleteTest do
  use Operately.DataCase, async: true

  alias Operately.Groups.Group
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.Delete
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{space: space}} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space)
             })

    assert space.id == Paths.space_id(ctx.space)
    refute Operately.Repo.get(Group, ctx.space.id)
  end

  test "returns invalid_arguments for a malformed space id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "space_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
