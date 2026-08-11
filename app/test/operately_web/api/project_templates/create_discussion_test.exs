defmodule OperatelyWeb.Api.ProjectTemplates.CreateDiscussionTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{Discussion, ProjectTemplate}
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
    |> Factory.add_project_template_discussion(:existing, :template, position: 0)
    |> Factory.log_in_person(:creator)
  end

  test "creates at the newest position and keeps existing discussions ordered", ctx do
    assert {200, response} = request(ctx)

    assert response.discussion.position == 0
    assert Repo.get_by!(Discussion, id: ctx.existing.id).position == 1
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
    assert Repo.aggregate(Discussion, :count) == 1
  end

  test "returns not found when the feature is disabled", ctx do
    assert {404, _} = request(Factory.disable_feature(ctx, "project_templates"))
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

  defp request(ctx),
    do:
      mutation(ctx.conn, [:project_templates, :create_discussion], %{
        template_id: Paths.project_template_id(ctx.template),
        title: "New reusable discussion",
        body: Jason.encode!(%{"type" => "doc", "content" => []})
      })
end
