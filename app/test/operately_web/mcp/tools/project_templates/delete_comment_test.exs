defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteCommentTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Comment
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.DeleteComment
  alias OperatelyWeb.Paths

  test "call/2 deletes a template comment" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_discussion(:discussion, :template)
      |> Factory.add_project_template_comment(:comment, :template, :discussion)

    assert {:ok, %{success: true}} =
             DeleteComment.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "comment_id" => Paths.project_template_comment_id(ctx.comment)
             })

    refute Operately.Repo.get(Comment, ctx.comment.id)
  end
end
