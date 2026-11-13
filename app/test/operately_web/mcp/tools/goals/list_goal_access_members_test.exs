defmodule OperatelyWeb.Mcp.Tools.Goals.ListGoalAccessMembersTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Goals.ListGoalAccessMembers, as: Tool
  alias OperatelyWeb.Paths

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_company_member(:member) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
    context = Access.get_context!(goal_id: ctx.goal.id)
    {:ok, _} = Access.bind_person(context, ctx.member.id, Binding.comment_access())
    ctx
  end

  test "returns direct access members and their access levels", ctx do
    assert {:ok, %{people: people}} = Tool.call(ToolConnHelper.conn(ctx), %{"goal_id" => Paths.goal_id(ctx.goal)})

    member = Enum.find(people, &(&1.id == Paths.person_id(ctx.member)))
    assert member.access_level == Binding.comment_access()
  end

  test "requires full goal access", ctx do
    assert {:error, :forbidden} = Tool.call(ToolConnHelper.conn_as(ctx, :member), %{"goal_id" => Paths.goal_id(ctx.goal)})
  end

  test "rejects foreign goals and malformed identifiers", ctx do
    other = Factory.setup(%{})
    assert {:error, :not_found, _} = Tool.call(ToolConnHelper.conn(other), %{"goal_id" => Paths.goal_id(ctx.goal)})
    assert {:error, :invalid_arguments} = Tool.call(ToolConnHelper.conn(ctx), %{"goal_id" => "definitely-not-a-valid-operately-id-%%%"})
  end
end
