defmodule OperatelyWeb.Api.ProjectTemplates.CreateMilestoneTest do
  use OperatelyWeb.TurboCase

  alias OperatelyWeb.Paths

  @permissions_table [
    %{permissions: :view_access, expected: 403},
    %{permissions: :comment_access, expected: 403},
    %{permissions: :edit_access, expected: 200},
    %{permissions: :full_access, expected: 200}
  ]

  setup ctx do
    ctx |> Factory.setup() |> Factory.enable_feature("project_templates") |> Factory.add_space(:space) |> Factory.add_project_template(:template, :space) |> Factory.log_in_person(:creator)
  end

  test "creates a milestone", ctx do
    assert {200, res} = mutation(ctx.conn, [:project_templates, :create_milestone], %{template_id: Paths.project_template_id(ctx.template), title: "Launch", due_offset_days: 0})
    assert res.milestone.title == "Launch"
    assert res.milestone.due_offset_days == 0
  end

  test "rejects negative offsets", ctx do
    assert {400, _} = mutation(ctx.conn, [:project_templates, :create_milestone], %{template_id: Paths.project_template_id(ctx.template), title: "Launch", due_offset_days: -1})
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :create_milestone], %{
                 template_id: Paths.project_template_id(ctx.template),
                 title: "Milestone"
               })

      assert code == @test.expected
    end
  end
end
