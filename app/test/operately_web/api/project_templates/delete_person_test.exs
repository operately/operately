defmodule OperatelyWeb.Api.ProjectTemplates.DeletePersonTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.TaskAssignment
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
    |> Factory.add_project_template_person(:template_person, :template, :creator)
    |> Factory.add_project_template_task_assignment(:assignment, :template, :task, :template_person)
    |> Factory.log_in_person(:creator)
  end

  test "deletes the person and their assignments", ctx do
    assert {200, %{success: true}} =
             mutation(ctx.conn, [:project_templates, :delete_person], %{template_id: Paths.project_template_id(ctx.template), template_person_id: Paths.project_template_person_id(ctx.template_person)})

    refute Repo.get(TaskAssignment, ctx.assignment.id)
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.log_in_person(:requester)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :delete_person], %{
                 template_id: Paths.project_template_id(ctx.template),
                 template_person_id: Paths.project_template_person_id(ctx.template_person)
               })

      assert code == @test.expected
    end
  end
end
