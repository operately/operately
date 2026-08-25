defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateDiscussionTest do
  use Operately.DataCase, async: true

  alias Operately.ProjectTemplates.Discussion
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.ProjectTemplates.CreateDiscussion
  alias OperatelyWeb.Paths

  test "call/2 creates a discussion on a template" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space, name: "Launch template", duration_days: 30)

    assert {:ok, %{discussion: discussion}} =
             CreateDiscussion.call(ToolConnHelper.conn(ctx), %{
               "template_id" => Paths.project_template_id(ctx.template),
               "title" => "New discussion",
               "body" => "Discuss the **plan**."
             })

    db_discussion =
      discussion.id
      |> ToolConnHelper.decode_id!()
      |> then(&Operately.Repo.get!(Discussion, &1))

    assert db_discussion.title == "New discussion"
    assert db_discussion.project_template_id == ctx.template.id
  end
end
