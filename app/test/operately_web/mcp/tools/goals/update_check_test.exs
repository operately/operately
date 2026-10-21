defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateCheckTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Executor
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateCheck
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 renames a checklist item" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_check(:check, :goal, name: "Launch the rewrite")

    assert {:ok, %{success: true}} =
             UpdateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => Paths.goal_check_id(ctx.check),
               "name" => String.duplicate("č", 2000)
             })

    assert ToolConnHelper.reload(ctx.check).name == String.duplicate("č", 2000)
  end

  test "returns a bad request for an oversized name without updating the check" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space) |> Factory.add_goal_check(:check, :goal)

    assert {:error, :bad_request, _message} =
             UpdateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => Paths.goal_check_id(ctx.check),
               "name" => String.duplicate("č", 2001)
             })

    assert ToolConnHelper.reload(ctx.check) == ctx.check
  end

  test "returns a translated tool error for a blank or oversized name" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space) |> Factory.add_goal_check(:check, :goal)
    assert {:ok, definition} = Executor.fetch_definition("update_goal_check")

    for {name, message} <- [{"", "can't be blank"}, {String.duplicate("😀", 2001), "should be at most 2000 character(s)"}] do
      assert {:ok, %{"isError" => true, "content" => [%{"type" => "text", "text" => ^message}]}} =
               Executor.execute(ToolConnHelper.conn(ctx), definition, %{
                 "goal_id" => Paths.goal_id(ctx.goal),
                 "check_id" => Paths.goal_check_id(ctx.check),
                 "name" => name
               })

      assert ToolConnHelper.reload(ctx.check) == ctx.check
    end
  end

  test "returns invalid_arguments for a malformed check id" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])

    assert {:error, :invalid_arguments} =
             UpdateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => "definitely-not-a-valid-operately-id-%%%",
               "name" => "Ship the onboarding rewrite"
             })
  end
end
