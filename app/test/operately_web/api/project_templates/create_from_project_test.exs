defmodule OperatelyWeb.Api.ProjectTemplates.CreateFromProjectTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]

  alias Operately.ContextualDates.ContextualDate
  alias Operately.ProjectTemplates.{Comment, Discussion, Person, ProjectTemplate, ResourceDocument}
  alias Operately.Projects.Project
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
    |> Factory.add_project(:source, :space, name: "Launch project")
    |> set_project_timeframe(~D[2028-01-10], ~D[2028-01-20])
    |> Factory.log_in_person(:creator)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:project_templates, :create_from_project], request_inputs(ctx))
  end

  test "creates an independent core template with rich-text content", ctx do
    description = %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}
    source_count = Repo.aggregate(Project, :count)

    assert {200, response} = request(ctx, name: "Reusable launch", description: Jason.encode!(description))
    assert response.schedule_issues == []
    assert response.template.name == "Reusable launch"

    template = Repo.get_by!(ProjectTemplate, name: "Reusable launch")
    assert template.description == description
    assert template.source_project_id == ctx.source.id
    assert template.space_id == ctx.space.id
    assert Repo.aggregate(Project, :count) == source_count
  end

  test "copies project people only when requested", ctx do
    assert {200, excluded} = request(ctx, name: "Without people")
    excluded_id = decode_id!(excluded.template.id)
    assert Repo.aggregate(from(p in Person, where: p.project_template_id == ^excluded_id), :count) == 0

    assert {200, included} = request(ctx, name: "With people", include_people_and_assignments: true)
    included_id = decode_id!(included.template.id)
    assert Repo.aggregate(from(p in Person, where: p.project_template_id == ^included_id), :count) > 0
  end

  test "copies discussions by default and excludes them when requested", ctx do
    ctx = Factory.add_project_discussion(ctx, :discussion, :source, title: "Reusable guidance")

    assert {200, included} = request(ctx, name: "With discussions")
    included_id = decode_id!(included.template.id)

    assert [%Discussion{title: "Reusable guidance", author_id: author_id, position: 0}] =
             Repo.all(from(discussion in Discussion, where: discussion.project_template_id == ^included_id))

    assert author_id == ctx.creator.id

    assert {200, excluded} = request(ctx, name: "Without discussions", include_discussions: false)
    excluded_id = decode_id!(excluded.template.id)

    assert Repo.aggregate(from(discussion in Discussion, where: discussion.project_template_id == ^excluded_id), :count) == 0
  end

  test "copies published Docs & Files by default and excludes them when requested", ctx do
    ctx =
      ctx
      |> Factory.fetch_default_project_resource_hub(:hub, :source)
      |> Factory.add_document(:document, :hub, name: "Reusable guide")

    assert {200, included} = request(ctx, name: "With resources")
    included_id = decode_id!(included.template.id)
    assert Repo.exists?(from(document in ResourceDocument, join: node in assoc(document, :node), where: node.project_template_id == ^included_id and document.name == "Reusable guide"))

    assert {200, excluded} = request(ctx, name: "Without resources", include_docs_and_files: false)
    excluded_id = decode_id!(excluded.template.id)
    assert Repo.aggregate(from(document in ResourceDocument, join: node in assoc(document, :node), where: node.project_template_id == ^excluded_id), :count) == 0
  end

  test "copies comments only when requested", ctx do
    ctx =
      ctx
      |> Factory.add_project_discussion(:discussion, :source)
      |> Factory.add_comment(:comment, :discussion)

    assert {200, excluded} = request(ctx, name: "Without comments")
    excluded_id = decode_id!(excluded.template.id)
    assert Repo.aggregate(from(c in Comment, where: c.project_template_id == ^excluded_id), :count) == 0

    assert {200, included} = request(ctx, name: "With comments", include_comments: true)
    included_id = decode_id!(included.template.id)
    assert Repo.aggregate(from(c in Comment, where: c.project_template_id == ^included_id), :count) == 1
  end

  test "returns every schedule issue without creating a template", ctx do
    ctx = set_project_timeframe(ctx, ~D[2028-01-10], ~D[2028-01-09])

    assert {200, response} = request(ctx)
    assert response.template == nil

    assert [issue] = response.schedule_issues
    assert issue.resource_type in [:project, "project"]
    assert issue.field in [:end_date, "end_date"]
    assert issue.reason in [:before_project_start, "before_project_start"]
    assert issue.resource_id == Paths.project_id(ctx.source)
    assert issue.resource_name == "Launch project"
    assert issue.date == ~D[2028-01-09] or issue.date == "2028-01-09"
    assert Repo.aggregate(ProjectTemplate, :count) == 0
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions} Space access", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _response} = request(ctx)
      assert code == @test.expected
    end
  end


  test "rejects company read-only mode", ctx do
    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx)
  end

  test "does not disclose projects from another company", ctx do
    other = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:source, :space)

    assert {404, _} = request(ctx, project_id: Paths.project_id(other.source))
  end

  test "does not copy deleted projects", ctx do
    Repo.soft_delete!(ctx.source)

    assert {404, _} = request(ctx)
    assert Repo.aggregate(ProjectTemplate, :count) == 0
  end

  test "accepts closed projects and resets their runtime state", ctx do
    ctx.source
    |> Project.changeset(%{status: "closed", closed_at: ~U[2028-01-21 12:00:00Z], success_status: :achieved})
    |> Repo.update!()

    assert {200, response} = request(ctx)
    assert response.template.name == "Launch project"
  end

  test "returns bad request for malformed source graphs and rolls back", ctx do
    source = ctx.source |> Project.changeset(%{milestones_ordering_state: ["foreign-milestone"]}) |> Repo.update!()

    assert {400, _} = request(%{ctx | source: source})
    assert Repo.aggregate(ProjectTemplate, :count) == 0
  end

  test "creates a template when project Kanban lists milestone-owned tasks", ctx do
    # Release 1.9-shaped source: every task has a milestone, but those same task
    # IDs still appear in project.tasks_kanban_state. Ordering is seeded from the board.
    pending = Enum.find(ctx.source.task_statuses, &(&1.value == "pending")) || List.first(ctx.source.task_statuses)

    ctx =
      ctx
      |> Factory.add_project_milestone(:launch, :source,
        title: "Launch",
        timeframe: %{
          contextual_start_date: nil,
          contextual_end_date: ContextualDate.create_day_date(~D[2028-01-15])
        }
      )
      |> Factory.add_project_task(:milestone_task, :launch,
        name: "Ship feature",
        task_status: Map.from_struct(pending)
      )

    source =
      ctx.source
      |> Project.changeset(%{
        milestones_ordering_state: [Paths.milestone_id(ctx.launch)],
        tasks_kanban_state: %{
          pending.value => [Paths.task_id(ctx.milestone_task)]
        }
      })
      |> Repo.update!()

    assert {200, response} = request(%{ctx | source: source}, name: "From Release shape")
    assert response.template != nil
    assert response.template.name == "From Release shape"
    assert response.schedule_issues == []
  end

  defp request(ctx, attrs \\ []) do
    mutation(ctx.conn, [:project_templates, :create_from_project], Enum.into(attrs, request_inputs(ctx)))
  end

  defp request_inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.source),
      name: ctx.source.name,
      description: ctx.source.description
    }
  end

  defp set_project_timeframe(ctx, start_date, end_date) do
    source =
      ctx.source
      |> Project.changeset(%{
        timeframe: %{
          contextual_start_date: start_date && ContextualDate.create_day_date(start_date),
          contextual_end_date: end_date && ContextualDate.create_day_date(end_date)
        }
      })
      |> Repo.update!()

    %{ctx | source: source}
  end

  defp decode_id!(id) do
    {:ok, decoded} = OperatelyWeb.Api.Helpers.decode_id(id)
    decoded
  end
end
