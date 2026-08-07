defmodule OperatelyWeb.Api.ProjectTemplates.UpdateTaskAssigneesTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding
  alias Operately.ProjectTemplates.{Person, ProjectTemplate, TaskAssignment}
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
    |> Factory.add_project_template_task(:task, :template)
    |> Factory.add_company_member(:first_member)
    |> Factory.add_company_member(:second_member)
    |> Factory.log_in_person(:creator)
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()}, [])
  end

  test "creates missing contributors and normalizes duplicate assignee IDs", ctx do
    assert {200, %{assignments: [assignment]}} =
             request(ctx,
               assignee_ids: [
                 Paths.person_id(ctx.first_member),
                 Paths.person_id(ctx.first_member)
               ]
             )

    template_person = Repo.get_by!(Person, project_template_id: ctx.template.id, person_id: ctx.first_member.id)

    assert template_person.role == :contributor
    assert template_person.access_level == Binding.edit_access()
    assert assignment.project_template_task_id == Paths.project_template_task_id(ctx.task)
    assert assignment.project_template_person_id == Paths.project_template_person_id(template_person)
    assert assignment_count(ctx) == 1
  end

  test "replaces the complete assignee list while retaining contributor records", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_person(:first_template_person, :template, :first_member)
      |> Factory.add_project_template_person(:second_template_person, :template, :second_member)
      |> Factory.add_project_template_task_assignment(:first_assignment, :template, :task, :first_template_person)
      |> Factory.add_project_template_task_assignment(:second_assignment, :template, :task, :second_template_person)
      |> Factory.add_company_member(:third_member)

    assert {200, %{assignments: assignments}} =
             request(ctx,
               assignee_ids: [
                 Paths.person_id(ctx.second_member),
                 Paths.person_id(ctx.third_member)
               ]
             )

    third_template_person = Repo.get_by!(Person, project_template_id: ctx.template.id, person_id: ctx.third_member.id)

    assert MapSet.new(assignments, & &1.project_template_person_id) ==
             MapSet.new([
               Paths.project_template_person_id(ctx.second_template_person),
               Paths.project_template_person_id(third_template_person)
             ])

    refute Repo.get(TaskAssignment, ctx.first_assignment.id)
    assert Repo.get(TaskAssignment, ctx.second_assignment.id)
    assert Repo.get(Person, ctx.first_template_person.id)
    assert assignment_count(ctx) == 2
  end

  test "clears assignments without removing template contributors", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_person(:template_person, :template, :first_member)
      |> Factory.add_project_template_task_assignment(:assignment, :template, :task, :template_person)

    assert {200, %{assignments: []}} = request(ctx, assignee_ids: [])

    refute Repo.get(TaskAssignment, ctx.assignment.id)
    assert Repo.get(Person, ctx.template_person.id)
  end

  test "preserves the role and access of people already represented in the template", ctx do
    ctx =
      Factory.add_project_template_person(ctx, :champion, :template, :first_member,
        role: :champion,
        responsibility: "Lead delivery",
        access_level: Binding.full_access()
      )

    assert {200, %{assignments: [assignment]}} =
             request(ctx, assignee_ids: [Paths.person_id(ctx.first_member)])

    champion = Repo.reload!(ctx.champion)

    assert assignment.project_template_person_id == Paths.project_template_person_id(champion)
    assert champion.role == :champion
    assert champion.responsibility == "Lead delivery"
    assert champion.access_level == Binding.full_access()
  end

  test "rejects suspended assignees and rolls back the complete replacement", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_person(:template_person, :template, :first_member)
      |> Factory.add_project_template_task_assignment(:assignment, :template, :task, :template_person)
      |> Factory.suspend_company_member(:second_member)

    assert {404, _} =
             request(ctx,
               assignee_ids: [
                 Paths.person_id(ctx.first_member),
                 Paths.person_id(ctx.second_member)
               ]
             )

    assert Repo.get(TaskAssignment, ctx.assignment.id)
    refute Repo.get_by(Person, project_template_id: ctx.template.id, person_id: ctx.second_member.id)
    assert assignment_count(ctx) == 1
  end

  test "does not accept assignees from another company", ctx do
    other_company = Operately.CompaniesFixtures.company_fixture(%{company_name: "Other company"})
    other_person = Operately.PeopleFixtures.person_fixture(%{company_id: other_company.id})

    assert {404, _} = request(ctx, assignee_ids: [Paths.person_id(other_person)])
    assert assignment_count(ctx) == 0
    refute Repo.get_by(Person, project_template_id: ctx.template.id, person_id: other_person.id)
  end

  test "does not disclose a task from another template", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_task(:foreign_task, :other_template)

    assert {404, _} = request(ctx, task_id: Paths.project_template_task_id(ctx.foreign_task))
    assert assignment_count(ctx) == 0
  end

  test "returns not found when the feature is disabled", ctx do
    ctx = Factory.disable_feature(ctx, "project_templates")

    assert {404, _} = request(ctx)
    assert assignment_count(ctx) == 0
  end

  test "rejects archived templates", ctx do
    template =
      ctx.template
      |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()})
      |> Repo.update!()

    assert {403, _} = request(%{ctx | template: template})
    assert assignment_count(ctx) == 0
  end

  test "rejects writes in company read-only mode", ctx do
    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx)
    assert assignment_count(ctx) == 0
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:requester, :space, permissions: @test.permissions)
        |> Factory.log_in_person(:requester)

      assert {code, _} = request(ctx)
      assert code == @test.expected

      if @test.expected == 200 do
        assert assignment_count(ctx) == 1
      else
        assert assignment_count(ctx) == 0
      end
    end
  end

  defp request(ctx, attrs \\ []) do
    defaults = %{
      template_id: Paths.project_template_id(ctx.template),
      task_id: Paths.project_template_task_id(ctx.task),
      assignee_ids: [Paths.person_id(ctx.first_member)]
    }

    mutation(ctx.conn, [:project_templates, :update_task_assignees], Enum.into(attrs, defaults))
  end

  defp assignment_count(ctx) do
    Repo.aggregate(
      from(a in TaskAssignment,
        where: a.project_template_id == ^ctx.template.id and a.project_template_task_id == ^ctx.task.id
      ),
      :count
    )
  end
end
