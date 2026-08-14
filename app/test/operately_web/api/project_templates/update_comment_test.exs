defmodule OperatelyWeb.Api.ProjectTemplates.UpdateCommentTest do
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
    |> Factory.add_project_template_comment(:comment, :template, :discussion, content: %{"type" => "doc", "content" => []})
    |> Factory.log_in_person(:creator)
  end

  test "updates comment content for any editor", ctx do
    ctx = ctx |> Factory.add_space_member(:editor, :space, permissions: :edit_access) |> Factory.log_in_person(:editor)

    assert {200, response} = request(ctx)
    assert Jason.decode!(response.comment.content) == %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}
    assert Repo.get!(Comment, ctx.comment.id).content == %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}
  end

  test "does not disclose comments from another template", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_discussion(:other_discussion, :other_template)
      |> Factory.add_project_template_comment(:other_comment, :other_template, :other_discussion)

    assert {404, _} = request(ctx, %{comment_id: Paths.project_template_comment_id(ctx.other_comment)})
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
      [:project_templates, :update_comment],
      Map.merge(
        %{
          template_id: Paths.project_template_id(ctx.template),
          comment_id: Paths.project_template_comment_id(ctx.comment),
          content: Jason.encode!(%{"type" => "doc", "content" => [%{"type" => "paragraph"}]})
        },
        attrs
      )
    )
  end
end
