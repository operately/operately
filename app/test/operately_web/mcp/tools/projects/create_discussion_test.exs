defmodule OperatelyWeb.Mcp.Tools.Projects.CreateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Comments.CommentThread
  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.CreateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a project discussion with safe notification defaults" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "title" => "Project discussion",
               "content" => "Project discussion content"
             })

    discussion = Operately.Repo.get!(CommentThread, ToolConnHelper.decode_id!(discussion.id))

    assert discussion.title == "Project discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.message) == "Project discussion content"

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
      |> Factory.add_project(:project, :space)

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "title" => "Project discussion",
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
      |> Factory.add_project(:project, :space)

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "title" => "Project discussion",
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
      |> Factory.add_project(:project, :space)

    assert {:error, :invalid_arguments} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "title" => "Project discussion",
               "content" => "Bad recipients",
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end

  defp subscription_list!(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])
    list
  end
end
