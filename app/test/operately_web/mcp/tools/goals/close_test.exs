defmodule OperatelyWeb.Mcp.Tools.Goals.CloseTest do
  use Operately.DataCase, async: true

  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.Close
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 closes a goal with safe notification defaults" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{goal: goal}} =
             Close.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "success_status" => "achieved",
               "retrospective" => "Goal reached successfully"
             })

    assert goal.id == Paths.goal_id(ctx.goal)

    goal = ToolConnHelper.reload(ctx.goal)

    assert goal.closed_at
    assert goal.success_status == :achieved

    list = subscription_list!(fetch_thread(ctx.goal, "goal_closing").id)

    refute list.send_to_everyone
    assert Enum.map(list.subscriptions, & &1.person_id) == [ctx.creator.id]
  end

  test "subscribes selected people from notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:other)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, _} =
             Close.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "success_status" => "achieved",
               "retrospective" => "Goal reached successfully",
               "notify_person_ids" => [Paths.person_id(ctx.other)]
             })

    list = subscription_list!(fetch_thread(ctx.goal, "goal_closing").id)

    refute list.send_to_everyone
    assert Enum.sort(Enum.map(list.subscriptions, & &1.person_id)) == Enum.sort([ctx.creator.id, ctx.other.id])
  end

  test "sets send_to_everyone when notify_everyone is true" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, _} =
             Close.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "success_status" => "achieved",
               "retrospective" => "Goal reached successfully",
               "notify_everyone" => true
             })

    list = subscription_list!(fetch_thread(ctx.goal, "goal_closing").id)

    assert list.send_to_everyone
  end

  test "call/2 returns invalid_arguments for an unsupported success_status" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:error, :invalid_arguments} =
             Close.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "success_status" => "partial",
               "retrospective" => "Goal reached successfully"
             })
  end

  test "returns invalid_arguments for malformed notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:error, :invalid_arguments} =
             Close.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "success_status" => "achieved",
               "retrospective" => "Goal reached successfully",
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end

  defp fetch_thread(goal, action) do
    activity =
      from(a in Activity,
        where: a.action == ^action and a.content["goal_id"] == ^goal.id,
        order_by: [desc: a.inserted_at],
        limit: 1,
        preload: [:comment_thread]
      )
      |> Repo.one()

    activity.comment_thread
  end

  defp subscription_list!(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])
    list
  end
end
