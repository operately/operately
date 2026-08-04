defmodule OperatelyWeb.Api.ProjectTemplates.UpdateTaskTest do
  use OperatelyWeb.TurboCase

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
    |> Factory.add_project_template_task(:task, :template)
    |> Factory.log_in_person(:creator)
  end

  test "updates and moves a task", ctx do
    assert {200, res} =
             mutation(ctx.conn, [:project_templates, :update_task], %{
               template_id: Paths.project_template_id(ctx.template),
               task_id: Paths.project_template_task_id(ctx.task),
               milestone_id: Paths.project_template_milestone_id(ctx.milestone),
               name: "Updated",
               due_offset_days: 7
             })

    assert res.task.name == "Updated"
    assert res.task.due_offset_days == 7
    assert res.task.project_template_milestone_id == Paths.project_template_milestone_id(ctx.milestone)
  end

  test "does not resolve a task from another template", ctx do
    ctx = ctx |> Factory.add_project_template(:other, :space) |> Factory.add_project_template_task(:foreign, :other)
    assert {404, _} = mutation(ctx.conn, [:project_templates, :update_task], %{template_id: Paths.project_template_id(ctx.template), task_id: Paths.project_template_task_id(ctx.foreign), name: "No"})
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :update_task], %{
                 template_id: Paths.project_template_id(ctx.template),
                 task_id: Paths.project_template_task_id(ctx.task),
                 name: "Updated"
               })

      assert code == @test.expected
    end
  end
end
