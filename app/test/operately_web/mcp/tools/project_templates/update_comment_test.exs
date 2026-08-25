defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateCommentTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Comment
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateComment
  alias OperatelyWeb.Paths

  test "call/2 updates a template comment" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_discussion(:discussion, :template)
      |> Factory.add_project_template_comment(:comment, :template, :discussion)

    assert {:ok, %{comment: comment}} =
             UpdateComment.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "comment_id" => Paths.project_template_comment_id(ctx.comment),
               "content" => "Updated comment"
             })

    db_comment = Operately.Repo.get!(Comment, ctx.comment.id)

    assert comment.id == Paths.project_template_comment_id(ctx.comment)
    assert ToolConnHelper.rich_text_to_string(db_comment.content) == "Updated comment"
  end
end
