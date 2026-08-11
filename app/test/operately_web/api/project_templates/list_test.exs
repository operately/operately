defmodule OperatelyWeb.Api.ProjectTemplates.ListTest do
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
    |> Factory.add_space(:alpha_space, name: "Alpha Space")
    |> Factory.add_space(:beta_space, name: "Beta Space")
    |> Factory.add_project_template(:launch, :alpha_space,
      name: "Launch",
      description: %{"type" => "doc", "content" => [%{"text" => "Customer rollout"}]},
      duration_days: 10
    )
    |> Factory.add_project_template_milestone(:milestone, :launch)
    |> Factory.add_project_template_task(:task, :launch, milestone: :milestone)
    |> Factory.add_project_template(:onboarding, :beta_space, name: "Onboarding")
    |> Factory.log_in_person(:creator)
  end

  test "requires authentication", _ctx do
    assert {401, _} = query(Phoenix.ConnTest.build_conn(), [:project_templates, :list], %{})
  end

  test "returns not found while the experimental feature is disabled", ctx do
    ctx = Factory.disable_feature(ctx, "project_templates")

    assert {404, _} = query(ctx.conn, [:project_templates, :list], %{})
  end

  test "returns lightweight card metadata and counts", ctx do
    ctx = Factory.add_project_template(ctx, :alpha, :alpha_space, name: "Alpha")

    assert {200, res} = query(ctx.conn, [:project_templates, :list], %{})

    assert Enum.map(res.templates, & &1.name) == ["Alpha", "Launch", "Onboarding"]

    launch = Enum.find(res.templates, &(&1.id == Paths.project_template_id(ctx.launch)))
    assert launch.description == Jason.encode!(ctx.launch.description)
    assert launch.duration_days == 10
    assert launch.space.id == Paths.space_id(ctx.alpha_space)
    assert launch.creator.id == Paths.person_id(ctx.creator)
    assert launch.milestone_count == 1
    assert launch.task_count == 1
    refute Map.has_key?(launch, :milestones)
    refute Map.has_key?(launch, :tasks)
    refute Map.has_key?(launch, :task_statuses)
    refute Map.has_key?(launch, :milestones_ordering_state)
    refute Map.has_key?(launch, :tasks_kanban_state)
  end

  test "returns an inactive-people summary without loading the people graph", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:inactive)
      |> Factory.add_project_template_person(:template_person, :launch, :inactive)
      |> Factory.add_project_template_task_assignment(:assignment, :launch, :task, :template_person)
      |> Factory.suspend_company_member(:inactive)

    assert {200, res} = query(ctx.conn, [:project_templates, :list], %{})
    launch = Enum.find(res.templates, &(&1.id == Paths.project_template_id(ctx.launch)))

    assert launch.inactive_people_summary == %{person_count: 1, role_count: 1, task_count: 1}
    refute Map.has_key?(launch, :people)
    refute Map.has_key?(launch, :task_assignments)
  end

  test "returns inactive discussion counts without loading discussions", ctx do
    ctx = Factory.add_company_member(ctx, :inactive_author)

    ctx =
      ctx
      |> Factory.add_project_template_discussion(:discussion, :launch, author: ctx.inactive_author)
      |> Factory.suspend_company_member(:inactive_author)

    assert {200, res} = query(ctx.conn, [:project_templates, :list], %{})
    launch = Enum.find(res.templates, &(&1.id == Paths.project_template_id(ctx.launch)))

    assert launch.inactive_discussion_count == 1
    refute Map.has_key?(launch, :discussions)
  end

  test "filters by Space and search across name and description", ctx do
    assert {200, res} = query(ctx.conn, [:project_templates, :list], %{space_id: Paths.space_id(ctx.beta_space)})
    assert Enum.map(res.templates, & &1.name) == ["Onboarding"]

    assert {200, res} = query(ctx.conn, [:project_templates, :list], %{search: "CUSTOMER ROLLOUT"})
    assert Enum.map(res.templates, & &1.name) == ["Launch"]
  end

  test "filters active, archived, and all templates", ctx do
    {:ok, _} = ctx.launch |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update()

    assert {200, active} = query(ctx.conn, [:project_templates, :list], %{})
    assert Enum.map(active.templates, & &1.name) == ["Onboarding"]

    assert {200, archived} = query(ctx.conn, [:project_templates, :list], %{archive_status: :archived})
    assert Enum.map(archived.templates, & &1.name) == ["Launch"]

    assert {200, all} = query(ctx.conn, [:project_templates, :list], %{archive_status: :all})
    assert Enum.map(all.templates, & &1.name) == ["Launch", "Onboarding"]
  end

  test "serializes a hard-deleted creator as nil", ctx do
    ctx = ctx |> Factory.add_company_member(:author) |> Factory.add_project_template(:authored, :alpha_space, creator: :author)
    Repo.delete!(ctx.author)

    assert {200, res} = query(ctx.conn, [:project_templates, :list], %{})
    assert Enum.find(res.templates, &(&1.id == Paths.project_template_id(ctx.authored))).creator == nil
  end

  test "never leaks metadata or counts from an inaccessible Space", ctx do
    ctx = ctx |> Factory.add_company_member(:outsider) |> Factory.log_in_person(:outsider)

    assert {200, res} = query(ctx.conn, [:project_templates, :list], %{search: "Launch", archive_status: :all})
    assert res.templates == []
    refute inspect(res) =~ "Launch"
    refute inspect(res) =~ "Customer rollout"
  end

  test "omits deleted templates", ctx do
    {:ok, _deleted} = ctx.launch |> ProjectTemplate.changeset(%{deleted_at: DateTime.utc_now()}) |> Repo.update()

    assert {200, res} = query(ctx.conn, [:project_templates, :list], %{archive_status: :all})
    assert Enum.map(res.templates, & &1.name) == ["Onboarding"]
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:person, :alpha_space, permissions: @test.permissions)
        |> Factory.log_in_person(:person)

      assert {code, res} = query(ctx.conn, [:project_templates, :list], %{space_id: Paths.space_id(ctx.alpha_space)})
      assert code == @test.expected
      assert Enum.map(res.templates, & &1.name) == ["Launch"]
    end
  end
end
