defmodule OperatelyWeb.Api.ProjectTemplates.GetTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.ProjectTemplate
  alias OperatelyWeb.Paths

  @permissions_table [
    %{permissions: :view_access, expected: 200, can_comment: false, can_edit: false, has_full_access: false},
    %{permissions: :comment_access, expected: 200, can_comment: true, can_edit: false, has_full_access: false},
    %{permissions: :edit_access, expected: 200, can_comment: true, can_edit: true, has_full_access: false},
    %{permissions: :full_access, expected: 200, can_comment: true, can_edit: true, has_full_access: true}
  ]

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space,
      name: "Launch Template",
      description: %{"type" => "doc", "content" => []},
      duration_days: 14
    )
    |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 7)
    |> Factory.add_project_template_task(:milestone_task, :template,
      milestone: :milestone,
      due_offset_days: 5,
      reminders: [%{type: :before_due, days: 2}]
    )
    |> Factory.add_project_template_task(:root_task, :template, due_offset_days: 0)
    |> Factory.log_in_person(:creator)
  end

  test "requires authentication", ctx do
    assert {401, _} = query(Phoenix.ConnTest.build_conn(), [:project_templates, :get], %{id: Paths.project_template_id(ctx.template)})
  end

  test "returns not found while the experimental feature is disabled", ctx do
    ctx = Factory.disable_feature(ctx, "project_templates")

    assert {404, _} = request(ctx)
  end

  test "returns the complete core template graph", ctx do
    assert {200, res} = request(ctx)

    assert res.template.id == Paths.project_template_id(ctx.template)
    assert res.template.name == "Launch Template"
    assert res.template.description == Jason.encode!(ctx.template.description)
    assert res.template.duration_days == 14
    assert res.template.space.id == Paths.space_id(ctx.space)
    assert res.template.creator.id == Paths.person_id(ctx.creator)
    assert length(res.template.task_statuses) == 4
    assert res.template.milestones_ordering_state == []
    assert res.template.tasks_kanban_state

    assert [milestone] = res.template.milestones
    assert milestone.__typename == "project_template_milestone"
    assert milestone.id == Paths.project_template_milestone_id(ctx.milestone)
    assert milestone.project_template_id == res.template.id
    assert milestone.due_offset_days == 7

    assert Enum.sort(Enum.map(res.template.tasks, & &1.id)) ==
             Enum.sort([Paths.project_template_task_id(ctx.milestone_task), Paths.project_template_task_id(ctx.root_task)])

    task = Enum.find(res.template.tasks, &(&1.id == Paths.project_template_task_id(ctx.milestone_task)))
    assert task.__typename == "project_template_task"
    assert task.project_template_id == res.template.id
    assert task.project_template_milestone_id == Paths.project_template_milestone_id(ctx.milestone)
    assert task.due_offset_days == 5
    assert task.reminders == [%{type: "before_due", days: 2, date: nil, __typename: "task_reminder"}]
  end

  test "returns archived templates", ctx do
    {:ok, archived} = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update()
    ctx = %{ctx | template: archived}

    assert {200, res} = request(ctx)
    assert res.template.archived_at
  end

  test "does not return deleted templates", ctx do
    {:ok, deleted} = ctx.template |> ProjectTemplate.changeset(%{deleted_at: DateTime.utc_now()}) |> Repo.update()
    ctx = %{ctx | template: deleted}

    assert {404, _} = request(ctx)
  end

  test "does not reveal a template from an inaccessible Space", ctx do
    ctx = ctx |> Factory.add_company_member(:outsider) |> Factory.log_in_person(:outsider)

    assert {404, res} = request(ctx)
    refute inspect(res) =~ ctx.template.name
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, res} = request(ctx)
      assert code == @test.expected

      assert res.template.permissions.can_view
      assert res.template.permissions.can_comment == @test.can_comment
      assert res.template.permissions.can_edit == @test.can_edit
      assert res.template.permissions.has_full_access == @test.has_full_access
    end
  end

  test "returns view-only permissions for archived templates", ctx do
    {:ok, archived} = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update()

    assert {200, res} = request(%{ctx | template: archived})
    assert res.template.permissions == %{__typename: "project_template_permissions", can_view: true, can_comment: false, can_edit: false, has_full_access: false}
  end

  test "returns view-only permissions in company read-only mode", ctx do
    alias Operately.Billing.CompanyBillingAccount

    %{company_id: ctx.company.id, access_state: :read_only}
    |> CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {200, res} = request(ctx)
    assert res.template.permissions == %{__typename: "project_template_permissions", can_view: true, can_comment: false, can_edit: false, has_full_access: false}
  end

  test "does not use source-project access", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:project_member)
      |> Factory.add_project(:source_project, :space)

    {:ok, template} = ctx.template |> ProjectTemplate.changeset(%{source_project_id: ctx.source_project.id}) |> Repo.update()

    ctx = ctx |> Map.put(:template, template) |> Factory.log_in_person(:project_member)

    assert {404, _} = request(ctx)
  end

  test "does not reveal a cross-company template", ctx do
    other_ctx =
      %{conn: Phoenix.ConnTest.build_conn()}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.log_in_person(:creator)

    assert {404, _} = query(other_ctx.conn, [:project_templates, :get], %{id: Paths.project_template_id(ctx.template)})
  end

  defp request(ctx) do
    query(ctx.conn, [:project_templates, :get], %{id: Paths.project_template_id(ctx.template)})
  end
end
