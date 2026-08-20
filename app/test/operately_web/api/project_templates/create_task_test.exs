defmodule OperatelyWeb.Api.ProjectTemplates.CreateTaskTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding
  alias Operately.ProjectTemplates.{Person, Task, TaskAssignment}
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
    |> Factory.add_project_template_milestone(:milestone, :template)
    |> Factory.add_company_member(:first_member)
    |> Factory.add_company_member(:second_member)
    |> Factory.log_in_person(:creator)
  end

  test "creates root and milestone tasks", ctx do
    assert {200, root} = mutation(ctx.conn, [:project_templates, :create_task], %{template_id: Paths.project_template_id(ctx.template), name: "Root"})
    assert root.task.project_template_milestone_id == nil

    assert {200, child} =
             mutation(ctx.conn, [:project_templates, :create_task], %{
               template_id: Paths.project_template_id(ctx.template),
               milestone_id: Paths.project_template_milestone_id(ctx.milestone),
               name: "Child",
               due_offset_days: 0
             })

    assert child.task.project_template_milestone_id == Paths.project_template_milestone_id(ctx.milestone)
  end

  test "creates the task and its assignees in one request", ctx do
    assert {200, response} =
             mutation(ctx.conn, [:project_templates, :create_task], %{
               template_id: Paths.project_template_id(ctx.template),
               name: "Assigned task",
               assignee_ids: [
                 Paths.person_id(ctx.first_member),
                 Paths.person_id(ctx.second_member),
                 Paths.person_id(ctx.first_member)
               ]
             })

    task_id = decode_id!(response.task.id)
    template_people = Repo.all(from p in Person, where: p.project_template_id == ^ctx.template.id)
    assignments = Repo.all(from a in TaskAssignment, where: a.project_template_task_id == ^task_id)

    assert length(template_people) == 2
    assert Enum.all?(template_people, &(&1.role == :contributor))
    assert Enum.all?(template_people, &(&1.access_level == Binding.edit_access()))
    assert MapSet.new(assignments, & &1.project_template_person_id) == MapSet.new(template_people, & &1.id)
  end

  test "rolls back the task and contributors when an assignee is invalid", ctx do
    ctx = Factory.suspend_company_member(ctx, :second_member)

    assert {404, _} =
             mutation(ctx.conn, [:project_templates, :create_task], %{
               template_id: Paths.project_template_id(ctx.template),
               name: "Rolled back task",
               assignee_ids: [Paths.person_id(ctx.first_member), Paths.person_id(ctx.second_member)]
             })

    refute Repo.get_by(Task, project_template_id: ctx.template.id, name: "Rolled back task")
    refute Repo.get_by(Person, project_template_id: ctx.template.id, person_id: ctx.first_member.id)
    refute Repo.exists?(from a in TaskAssignment, where: a.project_template_id == ^ctx.template.id)
  end

  test "does not accept a milestone from another template", ctx do
    ctx = ctx |> Factory.add_project_template(:other, :space) |> Factory.add_project_template_milestone(:foreign, :other)

    assert {404, _} =
             mutation(ctx.conn, [:project_templates, :create_task], %{template_id: Paths.project_template_id(ctx.template), milestone_id: Paths.project_template_milestone_id(ctx.foreign), name: "No"})
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :create_task], %{
                 template_id: Paths.project_template_id(ctx.template),
                 name: "Task"
               })

      assert code == @test.expected
    end
  end

  defp decode_id!(id) do
    {:ok, decoded} = OperatelyWeb.Api.Helpers.decode_id(id)
    decoded
  end
end
