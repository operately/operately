defmodule OperatelyWeb.Mcp.Tools.Goals.DeleteCheckInTest do
  use Operately.DataCase, async: true

  alias Operately.Goals.Update
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.DeleteCheckIn
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a goal check-in" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:check_in, :goal, :creator)

    assert {:ok, %{success: true}} =
             DeleteCheckIn.call(ToolConnHelper.conn(ctx), %{
               "check_in_id" => Paths.goal_update_id(ctx.check_in)
             })

    refute Operately.Repo.get(Update, ctx.check_in.id)
  end

  test "returns invalid_arguments for a malformed check-in id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             DeleteCheckIn.call(ToolConnHelper.conn(ctx), %{
               "check_in_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
