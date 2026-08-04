defmodule OperatelyWeb.Api.ProjectTemplates.DeleteMilestoneTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{Milestone, Task}
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
    |> Factory.add_project_template_task(:task, :template, milestone: :milestone)
    |> Factory.log_in_person(:creator)
  end

  test "deletes a milestone and its tasks", ctx do
    assert {200, %{success: true}} =
             mutation(ctx.conn, [:project_templates, :delete_milestone], %{template_id: Paths.project_template_id(ctx.template), milestone_id: Paths.project_template_milestone_id(ctx.milestone)})

    refute Repo.get(Milestone, ctx.milestone.id)
    refute Repo.get(Task, ctx.task.id)
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :delete_milestone], %{
                 template_id: Paths.project_template_id(ctx.template),
                 milestone_id: Paths.project_template_milestone_id(ctx.milestone)
               })

      assert code == @test.expected
    end
  end
end
