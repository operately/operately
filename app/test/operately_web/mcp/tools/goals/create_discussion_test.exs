defmodule OperatelyWeb.Mcp.Tools.Goals.CreateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Comments.CommentThread
  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.CreateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a goal discussion with safe notification defaults" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{discussion: discussion, activity_id: activity_id}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "title" => "Goal discussion",
               "content" => "Goal discussion content"
             })

    assert activity_id

    discussion = Operately.Repo.get!(CommentThread, ToolConnHelper.decode_id!(discussion.id))

    assert discussion.title == "Goal discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.message) == "Goal discussion content"

    list = subscription_list!(discussion.id)

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

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "title" => "Goal discussion",
               "content" => "Notify selected people",
               "notify_person_ids" => [Paths.person_id(ctx.other)]
             })

    list = subscription_list!(ToolConnHelper.decode_id!(discussion.id))

    refute list.send_to_everyone
    assert Enum.sort(Enum.map(list.subscriptions, & &1.person_id)) == Enum.sort([ctx.creator.id, ctx.other.id])
  end

  test "sets send_to_everyone when notify_everyone is true" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "title" => "Goal discussion",
               "content" => "Notify everyone",
               "notify_everyone" => true
             })

    list = subscription_list!(ToolConnHelper.decode_id!(discussion.id))

    assert list.send_to_everyone
  end

  test "returns invalid_arguments for malformed notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:error, :invalid_arguments} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "title" => "Goal discussion",
               "content" => "Bad recipients",
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end

  defp subscription_list!(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])
    list
  end
end
