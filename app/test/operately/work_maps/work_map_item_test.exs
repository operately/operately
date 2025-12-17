defmodule Operately.WorkMaps.WorkMapItemTest do
  use Operately.DataCase

  alias Operately.WorkMaps.WorkMapItem

  describe "build_item/2 for projects" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
    end

    test "a closed project should have status 'completed'", ctx do
      ctx =
        ctx
        |> Factory.add_project(:project, :space)
        |> Factory.close_project(:project)
        |> Factory.preload(:project, :last_check_in)
        |> Factory.preload(:project, :milestones)

      item = WorkMapItem.build_item(ctx.project, [], false)
      assert item.status == :achieved
    end

    @status [:on_track, :caution, :off_track]

    tabletest @status do
      test "given a project's last check-in is #{@test}, its status should also be #{@test}", ctx do
        ctx =
          ctx
          |> Factory.add_project(:project, :space)
          |> Factory.add_project_check_in(:check_in, :project, :creator, status: Atom.to_string(@test))
          |> Factory.preload(:project, :last_check_in)
          |> Factory.preload(:project, :milestones)

        item = WorkMapItem.build_item(ctx.project, [], false)
        assert item.status == @test
      end
    end

    test "a project which is not outdated and without check-in should be 'pending'", ctx do
      ctx =
        ctx
        |> Factory.add_project(:project, :space)
        |> Factory.preload(:project, :last_check_in)
        |> Factory.preload(:project, :milestones)

      item = WorkMapItem.build_item(ctx.project, [], false)
      assert item.status == :pending
    end
  end

  describe "build_item/3 for tasks" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
    end

    test "when task doesn't have a due date, timeframe is nil", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, nil, project_id: ctx.project.id, due_date: nil)
        |> Factory.preload(:task, [:assigned_people, :project_space, :space, :company])

      item = WorkMapItem.build_item(ctx.task, [], false)
      assert item.timeframe == nil
    end

    test "when task has a due date, timeframe uses it as contextual_end_date", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, nil, project_id: ctx.project.id)
        |> Factory.preload(:task, [:assigned_people, :project_space, :space, :company])

      task = ctx.task
      due_date = task.due_date
      item = WorkMapItem.build_item(task, [], false)

      assert %Operately.ContextualDates.Timeframe{contextual_start_date: nil, contextual_end_date: ^due_date} = item.timeframe
    end
  end
end
