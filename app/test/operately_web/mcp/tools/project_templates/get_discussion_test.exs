defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.GetDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.GetDiscussion
  alias OperatelyWeb.Paths

  test "call/2 returns one template discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_discussion(:discussion, :template, title: "Kickoff thread")

    assert {:ok, %{discussion: discussion}} =
             GetDiscussion.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "discussion_id" => Paths.project_template_discussion_id(ctx.discussion)
             })

    assert discussion.id == Paths.project_template_discussion_id(ctx.discussion)
    assert discussion.title == "Kickoff thread"
  end
end
