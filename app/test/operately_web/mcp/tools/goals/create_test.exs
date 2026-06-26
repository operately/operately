defmodule OperatelyWeb.Mcp.Tools.Goals.CreateTest do
  use Operately.DataCase, async: true

  alias Operately.Goals.Goal
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.Create
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a goal in a space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{goal: goal}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Goal",
               "description" => "Initial goal description",
               "start_date" => "2026-07-01",
               "due_date" => "2026-09-30"
             })

    goal = Operately.Repo.get!(Goal, ToolConnHelper.decode_id!(goal.id))

    assert goal.name == "MCP Goal"
    assert goal.group_id == ctx.space.id
    assert goal.timeframe.contextual_start_date.date == ~D[2026-07-01]
    assert goal.timeframe.contextual_end_date.date == ~D[2026-09-30]
    assert ToolConnHelper.rich_text_to_string(goal.description) == "Initial goal description"
  end

  test "call/2 creates a goal with only required params" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{goal: goal}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Goal"
             })

    goal = Operately.Repo.get!(Goal, ToolConnHelper.decode_id!(goal.id))

    assert goal.name == "MCP Goal"
    assert goal.group_id == ctx.space.id
    assert is_nil(goal.description)
    assert is_nil(goal.champion_id)
    assert is_nil(goal.reviewer_id)
    assert is_nil(goal.parent_goal_id)
    assert goal.timeframe.contextual_start_date.date == Date.utc_today()
    assert goal.timeframe.contextual_end_date == nil
  end
end
