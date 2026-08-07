defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateDiscussion
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a project discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_discussion(:discussion, :project)

    assert {:ok, %{discussion: discussion}} =
             UpdateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "discussion_id" => Paths.comment_thread_id(ctx.discussion),
               "title" => "Updated project discussion",
               "content" => "Updated project discussion content"
             })

    assert discussion.title == "Updated project discussion"

    discussion = ToolConnHelper.reload(ctx.discussion)

    assert discussion.title == "Updated project discussion"
    assert ToolConnHelper.rich_text_to_string(discussion.message) == "Updated project discussion content"
  end

  test "accepts notify_person_ids and notify_everyone without error" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:other)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_discussion(:discussion, :project)

    assert {:ok, %{discussion: discussion}} =
             UpdateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "discussion_id" => Paths.comment_thread_id(ctx.discussion),
               "title" => "Updated with recipients",
               "content" => "Updated body",
               "notify_person_ids" => [Paths.person_id(ctx.other)],
               "notify_everyone" => true
             })

    assert discussion.title == "Updated with recipients"
  end

  test "returns invalid_arguments for malformed notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_discussion(:discussion, :project)

    assert {:error, :invalid_arguments} =
             UpdateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "discussion_id" => Paths.comment_thread_id(ctx.discussion),
               "title" => "Updated",
               "content" => "Updated body",
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end
end
