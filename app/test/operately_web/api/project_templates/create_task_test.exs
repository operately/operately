defmodule OperatelyWeb.Api.ProjectTemplates.CreateTaskTest do
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
end
