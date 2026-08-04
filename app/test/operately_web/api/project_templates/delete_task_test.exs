defmodule OperatelyWeb.Api.ProjectTemplates.DeleteTaskTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.Task
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
    |> Factory.log_in_person(:creator)
  end

  test "deletes a task", ctx do
    assert {200, %{success: true}} = mutation(ctx.conn, [:project_templates, :delete_task], %{template_id: Paths.project_template_id(ctx.template), task_id: Paths.project_template_task_id(ctx.task)})
    refute Repo.get(Task, ctx.task.id)
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :delete_task], %{
                 template_id: Paths.project_template_id(ctx.template),
                 task_id: Paths.project_template_task_id(ctx.task)
               })

      assert code == @test.expected
    end
  end
end
