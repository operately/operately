defmodule OperatelyWeb.Mcp.Tools.Spaces.CreateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Messages.Message
  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Spaces.CreateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a space discussion with safe notification defaults" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "title" => "Space discussion",
               "content" => "Space discussion content"
             })

    discussion = Operately.Repo.get!(Message, ToolConnHelper.decode_id!(discussion.id))

    assert discussion.title == "Space discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.body) == "Space discussion content"

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

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "title" => "Space discussion",
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

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "title" => "Space discussion",
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

    assert {:error, :invalid_arguments} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "title" => "Space discussion",
               "content" => "Bad recipients",
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end

  defp subscription_list!(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])
    list
  end
end
