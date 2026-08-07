defmodule OperatelyWeb.Mcp.Tools.Goals.ReopenTest do
  use Operately.DataCase, async: true

  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.Reopen
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 reopens a closed goal with safe notification defaults" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.close_goal(:goal)

    assert {:ok, %{goal: goal}} =
             Reopen.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "message" => "Goal needs more work"
             })

    assert goal.id == Paths.goal_id(ctx.goal)
    assert is_nil(ToolConnHelper.reload(ctx.goal).closed_at)

    list = subscription_list!(fetch_thread(ctx.goal, "goal_reopening").id)

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
      |> Factory.close_goal(:goal)

    assert {:ok, _} =
             Reopen.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "message" => "Goal needs more work",
               "notify_person_ids" => [Paths.person_id(ctx.other)]
             })

    list = subscription_list!(fetch_thread(ctx.goal, "goal_reopening").id)

    refute list.send_to_everyone
    assert Enum.sort(Enum.map(list.subscriptions, & &1.person_id)) == Enum.sort([ctx.creator.id, ctx.other.id])
  end

  test "sets send_to_everyone when notify_everyone is true" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.close_goal(:goal)

    assert {:ok, _} =
             Reopen.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "message" => "Goal needs more work",
               "notify_everyone" => true
             })

    list = subscription_list!(fetch_thread(ctx.goal, "goal_reopening").id)

    assert list.send_to_everyone
  end

  test "returns invalid_arguments for malformed notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.close_goal(:goal)

    assert {:error, :invalid_arguments} =
             Reopen.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "message" => "Goal needs more work",
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
