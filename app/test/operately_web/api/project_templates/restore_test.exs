defmodule OperatelyWeb.Api.ProjectTemplates.RestoreTest do
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
    |> then(fn ctx -> %{ctx | template: ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()} end)
    |> Factory.log_in_person(:creator)
  end

  test "restores an archived template", ctx do
    counts_before = runtime_side_effect_counts()
    assert {200, %{success: true}} = request(ctx)
    assert Repo.reload!(ctx.template).archived_at == nil
    assert runtime_side_effect_counts() == counts_before
  end

  test "requires authentication and the feature gate", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:project_templates, :restore], %{})
    assert {404, _} = request(Factory.disable_feature(ctx, "project_templates"))
  end

  test "rejects active templates and company read-only mode", ctx do
    active = ctx.template |> ProjectTemplate.changeset(%{archived_at: nil}) |> Repo.update!()
    assert {400, _} = request(%{ctx | template: active})

    archived = active |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()
    %{company_id: ctx.company.id, access_state: :read_only} |> Operately.Billing.CompanyBillingAccount.changeset() |> Repo.insert!()
    assert {403, _} = request(%{ctx | template: archived})
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)
      assert {code, _} = request(ctx)
      assert code == @test.expected
    end
  end

  defp request(ctx), do: mutation(ctx.conn, [:project_templates, :restore], %{id: Paths.project_template_id(ctx.template)})

  defp runtime_side_effect_counts do
    {Repo.aggregate(Project, :count), Repo.aggregate(Activity, :count), Repo.aggregate(Notification, :count), Repo.aggregate(Subscription, :count), Repo.aggregate(SubscriptionList, :count)}
  end
end
