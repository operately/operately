defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateTargetTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Executor
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

  test "returns tool errors when the goal or target is missing" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_target(:target, :goal)

    arguments = %{"goal_id" => Paths.goal_id(ctx.goal), "target_id" => Paths.target_id(ctx.target), "name" => "Revenue"}
    assert {:ok, definition} = Executor.fetch_definition("update_goal_target")

    missing_goal = Map.put(arguments, "goal_id", Paths.goal_id(Ecto.UUID.generate()))
    missing_target = Map.put(arguments, "target_id", Paths.target_id(Ecto.UUID.generate()))

    assert {:ok, %{"isError" => true}} = Executor.execute(ToolConnHelper.conn(ctx), definition, missing_goal)
    assert {:ok, %{"isError" => true}} = Executor.execute(ToolConnHelper.conn(ctx), definition, missing_target)
  end

  test "returns validation errors for oversized names and units" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_target(:target, :goal)

    arguments = %{
      "goal_id" => Paths.goal_id(ctx.goal),
      "target_id" => Paths.target_id(ctx.target),
      "name" => "Revenue",
      "start_value" => 0,
      "target_value" => 100,
      "unit" => "USD"
    }

    assert {:ok, definition} = Executor.fetch_definition("update_goal_target")

    for field <- ["name", "unit"] do
      invalid_arguments = Map.put(arguments, field, String.duplicate("a", 256))
      assert {:error, :bad_request, message} = UpdateTarget.call(ToolConnHelper.conn(ctx), invalid_arguments)
      assert {:ok, result} = Executor.execute(ToolConnHelper.conn(ctx), definition, invalid_arguments)
      assert result == %{"isError" => true, "content" => [%{"type" => "text", "text" => message}]}

      assert message =~ "255"
      assert UpdateTarget.definition().input_schema["properties"][field]["maxLength"] == 255
    end
  end
end
