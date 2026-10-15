defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateTargetTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateTarget
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates the provided target fields" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_target(:target, :goal, name: "Revenue", from: 10, to: 100, value: 10, unit: "USD", index: 1)

    assert {:ok, %{success: true}} =
             UpdateTarget.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "target_id" => Paths.target_id(ctx.target),
               "name" => "ARR",
               "start_value" => 20,
               "target_value" => 200.5,
               "unit" => "EUR"
             })

    target = ToolConnHelper.reload(ctx.target)
    assert target.name == "ARR"
    assert target.from == 20.0
    assert target.to == 200.5
    assert target.unit == "EUR"
  end

  test "call/2 leaves omitted fields unchanged" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_target(:target, :goal, name: "Revenue", from: 10, to: 100, value: 10, unit: "USD", index: 1)

    assert {:ok, %{success: true}} =
             UpdateTarget.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "target_id" => Paths.target_id(ctx.target),
               "name" => "ARR"
             })

    target = ToolConnHelper.reload(ctx.target)
    assert target.name == "ARR"
    assert target.from == 10.0
    assert target.to == 100.0
    assert target.unit == "USD"
  end

  test "returns invalid_arguments for a malformed target id" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])

    assert {:error, :invalid_arguments} =
             UpdateTarget.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "target_id" => "definitely-not-a-valid-operately-id-%%%",
               "name" => "ARR"
             })
  end
end
