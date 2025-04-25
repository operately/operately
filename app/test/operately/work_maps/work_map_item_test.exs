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

      item = WorkMapItem.build_item(ctx.project, [])
      assert item.status == "completed"
    end

    @status ["on_track", "caution", "issue"]

    tabletest @status do
      test "given a project's last check-in is #{@test}, its status should also be #{@test}", ctx do
        ctx =
          ctx
          |> Factory.add_project(:project, :space)
          |> Factory.add_project_check_in(:check_in, :project, :creator, status: @test)
          |> Factory.preload(:project, :last_check_in)
          |> Factory.preload(:project, :milestones)

        item = WorkMapItem.build_item(ctx.project, [])
        assert item.status == @test
      end
    end

    test "a project without check-in should be 'on_track'", ctx do
      ctx =
        ctx
        |> Factory.add_project(:project, :space)
        |> Factory.preload(:project, :last_check_in)
        |> Factory.preload(:project, :milestones)

      item = WorkMapItem.build_item(ctx.project, [])
      assert item.status == "on_track"
    end
  end

  describe "build_item/2 for goals" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
    end

    test "a closed goal with success 'yes' should have status 'achieved'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.close_goal(:goal, success: "yes")
        |> Factory.preload(:goal, :last_update)

      item = WorkMapItem.build_item(ctx.goal, [])
      assert item.status == "achieved"
    end

    test "a closed goal with success 'no' should have status 'missed'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.close_goal(:goal, success: "no")
        |> Factory.preload(:goal, :last_update)

      item = WorkMapItem.build_item(ctx.goal, [])
      assert item.status == "missed"
    end

    @status [:pending, :on_track, :concern, :issue]

    tabletest @status do
      test "given a goal's last update is #{@test}, its status should also be #{@test}", ctx do
        ctx =
          ctx
          |> Factory.add_goal(:goal, :space)
          |> Factory.add_goal_update(:update, :goal, :creator, status: @test)
          |> Factory.preload(:goal, :last_update)

        item = WorkMapItem.build_item(ctx.goal, [])
        assert item.status == @test
      end
    end

    test "a goal without update should be 'on_track'", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.preload(:goal, :last_update)

      item = WorkMapItem.build_item(ctx.goal, [])
      assert item.status == "on_track"
    end
  end
end
