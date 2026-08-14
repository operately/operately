defmodule OperatelyWeb.Api.ProjectTemplates.DeleteCommentTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{Comment, ProjectTemplate}
  alias OperatelyWeb.Paths

  @permissions_table [
    %{permissions: :view_access, expected: 403},
    %{permissions: :comment_access, expected: 403},
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
    |> Factory.add_project_template_comment(:comment, :template, :discussion)
    |> Factory.log_in_person(:creator)
  end

  test "deletes a comment", ctx do
    assert {200, %{success: true}} = request(ctx)
    refute Repo.get(Comment, ctx.comment.id)
  end

  test "does not disclose comments from another template", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_discussion(:other_discussion, :other_template)
      |> Factory.add_project_template_comment(:other_comment, :other_template, :other_discussion)

    assert {404, _} = request(ctx, %{comment_id: Paths.project_template_comment_id(ctx.other_comment)})
    assert Repo.get(Comment, ctx.other_comment.id)
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
  end

  test "rejects archived templates and read-only companies", ctx do
    template = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()
    assert {403, _} = request(%{ctx | template: template})

    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx)
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.log_in_person(:requester)
      assert {code, _} = request(ctx)
      assert code == @test.expected
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(
      ctx.conn,
      [:project_templates, :delete_comment],
      Map.merge(%{template_id: Paths.project_template_id(ctx.template), comment_id: Paths.project_template_comment_id(ctx.comment)}, attrs)
    )
  end
end
