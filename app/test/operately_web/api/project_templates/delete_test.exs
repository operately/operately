defmodule OperatelyWeb.Api.ProjectTemplates.DeleteTest do
  use OperatelyWeb.TurboCase

  alias Operately.Activities.Activity
  alias Operately.Notifications.{Notification, Subscription, SubscriptionList}
  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Projects.Project
  alias OperatelyWeb.Paths

  @permissions_table [
    %{permissions: :no_access, expected: 404},
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
    |> Factory.add_project(:project, :space, name: "Generated project")
    |> then(fn ctx -> %{ctx | project: ctx.project |> Project.changeset(%{source_template_id: ctx.template.id}) |> Repo.update!()} end)
    |> Factory.log_in_person(:creator)
  end

  test "deletes active and archived templates without deleting generated projects", ctx do
    counts_before = runtime_side_effect_counts()
    assert {200, %{success: true}} = request(ctx)

    assert Repo.get(ProjectTemplate, ctx.template.id) == nil
    assert Repo.reload!(ctx.project).source_template_id == nil
    assert runtime_side_effect_counts() == counts_before
    assert {404, _} = query(ctx.conn, [:project_templates, :get], %{id: Paths.project_template_id(ctx.template)})

    ctx = Factory.add_project_template(ctx, :archived, :space)
    archived = ctx.archived |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()
    assert {200, %{success: true}} = request(%{ctx | template: archived})
    assert Repo.get(ProjectTemplate, archived.id) == nil
  end

  test "rejects company read-only mode", ctx do
    %{company_id: ctx.company.id, access_state: :read_only} |> Operately.Billing.CompanyBillingAccount.changeset() |> Repo.insert!()
    assert {403, _} = request(ctx)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:project_templates, :delete], %{})
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)
      assert {code, _} = request(ctx)
      assert code == @test.expected
    end
  end

  defp request(ctx), do: mutation(ctx.conn, [:project_templates, :delete], %{id: Paths.project_template_id(ctx.template)})

  defp runtime_side_effect_counts do
    {Repo.aggregate(Project, :count), Repo.aggregate(Activity, :count), Repo.aggregate(Notification, :count), Repo.aggregate(Subscription, :count), Repo.aggregate(SubscriptionList, :count)}
  end
end
