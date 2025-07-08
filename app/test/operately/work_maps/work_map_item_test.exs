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
end
