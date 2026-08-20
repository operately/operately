defmodule OperatelyWeb.Api.ProjectTemplates.UpdateMilestoneAndOrderingTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.Milestone
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

  test "reorders a task within its milestone", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_task(:first, :template, milestone: :milestone)
      |> Factory.add_project_template_task(:second, :template, milestone: :milestone)
      |> Factory.add_project_template_task(:third, :template, milestone: :milestone)

    first_id = Paths.project_template_task_id(ctx.first)
    second_id = Paths.project_template_task_id(ctx.second)
    third_id = Paths.project_template_task_id(ctx.third)
    set_milestone_state(ctx.milestone, [first_id, second_id, third_id])

    assert {200, _} = request(ctx, ctx.first, %{milestone_id: Paths.project_template_milestone_id(ctx.milestone), index: 2})

    milestone = Repo.reload!(ctx.milestone)
    assert milestone.tasks_ordering_state == [second_id, third_id, first_id]
  end

  test "moves a task between milestones", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_milestone(:destination, :template)
      |> Factory.add_project_template_task(:moving, :template, milestone: :milestone)
      |> Factory.add_project_template_task(:source_sibling, :template, milestone: :milestone)
      |> Factory.add_project_template_task(:destination_task, :template, milestone: :destination)

    moving_id = Paths.project_template_task_id(ctx.moving)
    source_sibling_id = Paths.project_template_task_id(ctx.source_sibling)
    destination_task_id = Paths.project_template_task_id(ctx.destination_task)
    set_milestone_state(ctx.milestone, [moving_id, source_sibling_id])
    set_milestone_state(ctx.destination, [destination_task_id])

    assert {200, res} =
             request(ctx, ctx.moving, %{
               milestone_id: Paths.project_template_milestone_id(ctx.destination),
               index: 0
             })

    assert res.task.project_template_milestone_id == Paths.project_template_milestone_id(ctx.destination)

    source = Repo.reload!(ctx.milestone)
    destination = Repo.reload!(ctx.destination)
    assert source.tasks_ordering_state == [source_sibling_id]
    assert destination.tasks_ordering_state == [moving_id, destination_task_id]
  end

  test "moves a task to the root container", ctx do
    ctx = Factory.add_project_template_task(ctx, :moving, :template, milestone: :milestone)
    moving_id = Paths.project_template_task_id(ctx.moving)
    set_milestone_state(ctx.milestone, [moving_id])

    assert {200, res} = request(ctx, ctx.moving, %{milestone_id: nil, index: 0})
    assert res.task.project_template_milestone_id == nil
    assert Repo.reload!(ctx.milestone).tasks_ordering_state == []
  end

  test "clamps indexes beyond the destination length", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_task(:first, :template, milestone: :milestone)
      |> Factory.add_project_template_task(:second, :template, milestone: :milestone)

    first_id = Paths.project_template_task_id(ctx.first)
    second_id = Paths.project_template_task_id(ctx.second)
    set_milestone_state(ctx.milestone, [first_id, second_id])

    assert {200, _} = request(ctx, ctx.first, %{milestone_id: Paths.project_template_milestone_id(ctx.milestone), index: 100})
    assert Repo.reload!(ctx.milestone).tasks_ordering_state == [second_id, first_id]
  end

  test "rejects a negative index without changing the task or either container", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_milestone(:destination, :template)
      |> Factory.add_project_template_task(:moving, :template, milestone: :milestone)

    moving_id = Paths.project_template_task_id(ctx.moving)
    set_milestone_state(ctx.milestone, [moving_id])

    assert {400, _} =
             request(ctx, ctx.moving, %{
               milestone_id: Paths.project_template_milestone_id(ctx.destination),
               index: -1
             })

    assert Repo.reload!(ctx.moving).project_template_milestone_id == ctx.milestone.id
    assert Repo.reload!(ctx.milestone).tasks_ordering_state == [moving_id]
    assert Repo.reload!(ctx.destination).tasks_ordering_state == []
  end

  test "does not move a task to a milestone from another template", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_milestone(:foreign_milestone, :other_template)

    assert {404, _} =
             request(ctx, ctx.task, %{
               milestone_id: Paths.project_template_milestone_id(ctx.foreign_milestone),
               index: 0
             })

    assert Repo.reload!(ctx.task).project_template_milestone_id == nil
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :update_milestone_and_ordering], %{
                 template_id: Paths.project_template_id(ctx.template),
                 task_id: Paths.project_template_task_id(ctx.task),
                 milestone_id: nil,
                 index: 0
               })

      assert code == @test.expected
    end
  end

  defp request(ctx, task, attrs) do
    mutation(
      ctx.conn,
      [:project_templates, :update_milestone_and_ordering],
      attrs
      |> Map.put(:template_id, Paths.project_template_id(ctx.template))
      |> Map.put(:task_id, Paths.project_template_task_id(task))
    )
  end

  defp set_milestone_state(milestone, task_ids) do
    milestone
    |> Milestone.changeset(%{tasks_ordering_state: task_ids})
    |> Repo.update!()
  end
end
