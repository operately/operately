defmodule OperatelyWeb.Api.ProjectTemplates.CreateProjectTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Repo

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
    |> Factory.add_project_template(:template, :space, duration_days: 10)
    |> Factory.add_project_template_milestone(:milestone, :template, due_offset_days: 5)
    |> Factory.add_project_template_task(:task, :template, milestone: :milestone, due_offset_days: 3)
    |> Factory.log_in_person(:creator)
  end

  test "requires authentication", _ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:project_templates, :create_project], %{})
  end

  test "creates an independent project from an active template", ctx do
    assert {200, response} = request(ctx)
    {:ok, project_id} = OperatelyWeb.Api.Helpers.decode_id(response.project.id)
    project = Repo.get!(Operately.Projects.Project, project_id) |> Repo.preload([:milestones, :tasks])

    assert project.source_template_id == ctx.template.id
    assert project.group_id == ctx.space.id
    assert Operately.ContextualDates.Timeframe.start_date(project.timeframe) == ~D[2028-01-10]
    assert Operately.ContextualDates.Timeframe.end_date(project.timeframe) == ~D[2028-01-20]
    assert length(project.milestones) == 1
    assert length(project.tasks) == 1
  end

  test "requires a start date", ctx do
    assert {400, _} = request(ctx, start_date: nil)
  end


  test "rejects archived templates", ctx do
    template = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()
    assert {403, _} = request(%{ctx | template: template})
  end

  test "does not disclose templates from another Space", ctx do
    ctx = ctx |> Factory.add_space(:other_space) |> Factory.add_project_template(:other_template, :other_space)
    assert {404, _} = request(ctx, template_id: Paths.project_template_id(ctx.other_template))
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions} Space access", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _response} = request(ctx)
      assert code == @test.expected
    end
  end

  test "rejects creation in company read-only mode", ctx do
    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx)
  end

  defp request(ctx, attrs \\ []) do
    defaults = %{
      space_id: Paths.space_id(ctx.space),
      template_id: Paths.project_template_id(ctx.template),
      start_date: "2028-01-10",
      name: "Generated project",
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.view_access(),
      space_access_level: Binding.edit_access()
    }

    mutation(ctx.conn, [:project_templates, :create_project], Enum.into(attrs, defaults))
  end
end
