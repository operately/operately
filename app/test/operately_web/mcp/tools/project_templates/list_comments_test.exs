defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.ListCommentsTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.ListComments
  alias OperatelyWeb.Paths

  test "call/2 lists comments on a template discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_discussion(:discussion, :template)
      |> Factory.add_project_template_comment(:comment, :template, :discussion)

    assert {:ok, %{comments: comments}} =
             ListComments.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "parent_type" => "discussion",
               "parent_id" => Paths.project_template_discussion_id(ctx.discussion)
             })

    assert Enum.map(comments, & &1.id) == [Paths.project_template_comment_id(ctx.comment)]
  end
end
