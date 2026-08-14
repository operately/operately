defmodule OperatelyWeb.Api.ProjectTemplates.ListCommentsTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.ProjectTemplate
  alias OperatelyWeb.Paths

  @permissions_table [
    %{permissions: :view_access, expected: 200},
    %{permissions: :comment_access, expected: 200},
    %{permissions: :edit_access, expected: 200},
    %{permissions: :full_access, expected: 200}
  ]

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
    |> Factory.add_project_template_discussion(:discussion, :template)
    |> Factory.add_project_template_comment(:first, :template, :discussion, content: %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}, position: 0)
    |> Factory.add_project_template_comment(:second, :template, :discussion, content: %{"type" => "doc", "content" => []}, position: 1)
    |> Factory.log_in_person(:creator)
  end

  test "returns comments in stored order", ctx do
    assert {200, response} = request(ctx)

    assert Enum.map(response.comments, & &1.id) == [Paths.project_template_comment_id(ctx.first), Paths.project_template_comment_id(ctx.second)]
    assert hd(response.comments).parent_type in [:discussion, "discussion"]
    assert hd(response.comments).parent_id == Paths.project_template_discussion_id(ctx.discussion)
  end

  test "returns comments on an archived template for readers", ctx do
    template = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()

    assert {200, response} = request(%{ctx | template: template})
    assert Enum.count(response.comments) == 2
  end

  test "does not disclose comments from another template", ctx do
    ctx = ctx |> Factory.add_project_template(:other_template, :space) |> Factory.add_project_template_discussion(:other_discussion, :other_template)

    assert {404, _} = request(ctx, %{parent_id: Paths.project_template_discussion_id(ctx.other_discussion)})
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
  end

  test "returns not found when the feature is disabled", ctx do
    assert {404, _} = request(Factory.disable_feature(ctx, "project_templates"))
  end

  tabletest @permissions_table do
    test "allows #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.log_in_person(:requester)
      assert {code, _} = request(ctx)
      assert code == @test.expected
    end
  end

  defp request(ctx, attrs \\ %{}), do: query(ctx.conn, [:project_templates, :list_comments], Map.merge(inputs(ctx), attrs))

  defp inputs(ctx),
    do: %{
      template_id: Paths.project_template_id(ctx.template),
      parent_type: "discussion",
      parent_id: Paths.project_template_discussion_id(ctx.discussion)
    }
end
