defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Discussion
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateDiscussion
  alias OperatelyWeb.Paths

  test "call/2 updates a template discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_discussion(:discussion, :template, title: "Original")

    assert {:ok, %{discussion: discussion}} =
             UpdateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "discussion_id" => Paths.project_template_discussion_id(ctx.discussion),
               "title" => "Updated discussion",
               "body" => "Updated body"
             })

    db_discussion = Operately.Repo.get!(Discussion, ctx.discussion.id)

    assert discussion.title == "Updated discussion"
    assert db_discussion.title == "Updated discussion"
    assert ToolConnHelper.rich_text_to_string(db_discussion.body) == "Updated body"
  end
end
