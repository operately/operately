defmodule OperatelyWeb.Api.ProjectTemplates.GetDiscussionTest do
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
    |> Factory.add_project_template_discussion(:discussion, :template, title: "Reusable discussion", position: 0)
    |> Factory.log_in_person(:creator)
  end

  test "returns an archived discussion for readers", ctx do
    template = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()

    assert {200, response} = request(%{ctx | template: template})
    assert response.discussion.title == "Reusable discussion"
  end

  test "does not disclose a discussion from another template", ctx do
    ctx = ctx |> Factory.add_project_template(:other_template, :space) |> Factory.add_project_template_discussion(:other_discussion, :other_template)

    assert {404, _} = request(ctx, %{discussion_id: Paths.project_template_discussion_id(ctx.other_discussion)})
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

  defp request(ctx, attrs \\ %{}), do: query(ctx.conn, [:project_templates, :get_discussion], Map.merge(inputs(ctx), attrs))

  defp inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), discussion_id: Paths.project_template_discussion_id(ctx.discussion)}
end
