defmodule OperatelyWeb.Mcp.Tools.Projects.DeleteCheckInTest do
  use Operately.DataCase, async: true

  alias Operately.Projects.CheckIn
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.DeleteCheckIn
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a project check-in" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_check_in(:check_in, :project, :creator)

    assert {:ok, %{success: true}} =
             DeleteCheckIn.call(ToolConnHelper.conn(ctx), %{
               "check_in_id" => Paths.project_check_in_id(ctx.check_in)
             })

    refute Operately.Repo.get(CheckIn, ctx.check_in.id)
  end

  test "returns invalid_arguments for a malformed check-in id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             DeleteCheckIn.call(ToolConnHelper.conn(ctx), %{
               "check_in_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
