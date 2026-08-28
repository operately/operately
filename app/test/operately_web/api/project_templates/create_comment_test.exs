defmodule OperatelyWeb.Api.ProjectTemplates.CreateCommentTest do
  use OperatelyWeb.TurboCase

  alias Operately.Activities.Activity
  alias Operately.Notifications.Notification
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
    |> Factory.add_project_template_comment(:existing, :template, :discussion, position: 0)
    |> Factory.log_in_person(:creator)
  end

  test "appends a comment without activities or notifications", ctx do
    activity_count = Repo.aggregate(Activity, :count)
    notification_count = Repo.aggregate(Notification, :count)

    assert {200, response} = request(ctx)

    assert response.comment.position == 1
    assert Repo.get_by!(Comment, id: ctx.existing.id).position == 0
    assert Repo.aggregate(Activity, :count) == activity_count
    assert Repo.aggregate(Notification, :count) == notification_count
  end

  test "does not accept a parent from another template", ctx do
    ctx = ctx |> Factory.add_project_template(:other_template, :space) |> Factory.add_project_template_discussion(:other_discussion, :other_template)

    assert {404, _} = request(ctx, %{parent_id: Paths.project_template_discussion_id(ctx.other_discussion)})
    assert Repo.aggregate(Comment, :count) == 1
  end

  test "comments on a document in the same template", ctx do
    ctx = Factory.add_project_template_resource_document(ctx, :document, :template)

    assert {200, response} =
             request(ctx, %{
               parent_type: "document",
               parent_id: Paths.project_template_resource_document_id(ctx.document)
             })

    assert response.comment.parent_id == Paths.project_template_resource_document_id(ctx.document)
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
    assert Repo.aggregate(Comment, :count) == 1
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
      [:project_templates, :create_comment],
      Map.merge(
        %{
          template_id: Paths.project_template_id(ctx.template),
          parent_type: "discussion",
          parent_id: Paths.project_template_discussion_id(ctx.discussion),
          content: Jason.encode!(%{"type" => "doc", "content" => []})
        },
        attrs
      )
    )
  end
end
