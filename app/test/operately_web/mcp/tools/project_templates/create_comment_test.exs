defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateCommentTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Comment
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateComment
  alias OperatelyWeb.Paths

  test "call/2 adds a comment to a template discussion" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)
      |> Factory.add_project_template_discussion(:discussion, :template)

    assert {:ok, %{comment: comment}} =
             CreateComment.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "parent_type" => "discussion",
               "parent_id" => Paths.project_template_discussion_id(ctx.discussion),
               "content" => "New comment"
             })

    db_comment =
      comment.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Comment, &1))

    assert db_comment.parent_id == ctx.discussion.id
    assert db_comment.parent_type == :discussion
  end
end
