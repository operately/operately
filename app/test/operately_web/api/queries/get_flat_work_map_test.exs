defmodule OperatelyWeb.Api.Queries.GetFlatWorkMapTest do
  use OperatelyWeb.TurboCase

  alias OperatelyWeb.Paths
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_flat_work_map, %{})
    end
  end

  describe "permissions - flat list access" do
    @table [
      %{person: :company_member,  count: 1,   expected_items: [:public_project]},
      %{person: :space_member,    count: 3,   expected_items: [:public_project, :project1, :project2]},
      %{person: :creator,         count: 4,   expected_items: [:public_project, :project1, :project2, :secret_project]},
      %{person: :champion,        count: 4,   expected_items: [:public_project, :project1, :project2, :secret_project]},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space_member(:space_member, :space)
      |> Factory.add_space_member(:champion, :space)

      # Project hierarchy:
      # ├── public_project  (accessible to everyone)
      # ├── project1        (accessible to space members only)
      # ├── project2        (accessible to space members only)
      # └── secret_project  (accessible to admin and champion only)
      |> Factory.add_project(:public_project, :space)
      |> Factory.add_project(:project1, :space, company_access_level: Binding.no_access())
      |> Factory.add_project(:project2, :space, company_access_level: Binding.no_access())
      |> Factory.add_project(:secret_project, :space, [
        champion: :champion,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      ])
    end

    tabletest @table do
      test "#{@test.person} has access to #{Enum.map_join(@test.expected_items, ", ", &Atom.to_string/1)}", ctx do
        ctx = Factory.log_in_person(ctx, @test.person)
        expected_items = Enum.map(@test.expected_items, &Paths.goal_id(ctx[&1]))

        assert {200, res} = query(ctx.conn, :get_flat_work_map, %{})

        # In flat list, items have no children field
        assert length(res.work_map) == @test.count

        # Verify all expected items are present
        item_ids = Enum.map(res.work_map, & &1.id)
        Enum.each(expected_items, fn id ->
          assert id in item_ids
        end)
      end
    end
  end

  describe "permissions - nested items in flat list" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space_member(:space_member, :space)
      |> Factory.add_space_member(:champion, :space)
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:child_goal, :space, parent_goal: :parent_goal)

      # Project hierarchy:
      # parent_goal
      # └── child_goal
      #     ├── public_project  (accessible to everyone)
      #     ├── project1        (accessible to space members only)
      #     ├── project2        (accessible to space members only)
      #     └── secret_project  (accessible to champion only)
      |> Factory.add_project(:public_project, :space, goal: :child_goal)
      |> Factory.add_project(:project1, :space, goal: :child_goal, company_access_level: Binding.no_access())
      |> Factory.add_project(:project2, :space, goal: :child_goal, company_access_level: Binding.no_access())
      |> Factory.add_project(:secret_project, :space, [
        goal: :child_goal,
        champion: :champion,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      ])
    end

    @table [
      %{person: :company_member,  expected_items: 3,   projects_count: 1},
      %{person: :space_member,    expected_items: 5,   projects_count: 3},
      %{person: :creator,         expected_items: 6,   projects_count: 4},
      %{person: :champion,        expected_items: 6,   projects_count: 4},
    ]

    tabletest @table do
      test "#{@test.person} sees the correct items in flat list", ctx do
        ctx = Factory.log_in_person(ctx, @test.person)

        assert {200, res} = query(ctx.conn, :get_flat_work_map, %{})

        # For flat list, we see all accessible items
        assert length(res.work_map) == @test.expected_items

        # Verify that the projects have the correct parent_id
        projects = Enum.filter(res.work_map, &(&1.type == "project"))
        assert length(projects) == @test.projects_count

        # All projects should have child_goal as parent
        Enum.each(projects, fn project ->
          assert project.parent_id == ctx.child_goal.id
        end)
      end
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space1)
      |> Factory.add_space(:space2)
      |> Factory.add_space(:space3)
      |> Factory.add_goal(:goal1, :space1)
      |> Factory.add_goal(:goal2, :space1)
      |> Factory.add_project(:project1, :space1)
      |> Factory.add_project(:project2, :space2)
    end

    test "returns empty list when no matching items exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Query with a non-existent space_id
      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{space_id: Paths.space_id(ctx.space3)})
      assert res.work_map == []
    end

    test "filters by space_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Query for space1
      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{space_id: Paths.space_id(ctx.space1)})

      # Should return 3 items from space1
      assert length(res.work_map) == 3
      item_ids = Enum.map(res.work_map, & &1.id)
      assert Paths.goal_id(ctx.goal1) in item_ids
      assert Paths.goal_id(ctx.goal2) in item_ids
      assert Paths.project_id(ctx.project1) in item_ids

      # Query for space2
      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{space_id: Paths.space_id(ctx.space2)})

      # Should return 1 item from space2
      assert length(res.work_map) == 1
      assert Enum.at(res.work_map, 0).id == Paths.project_id(ctx.project2)
    end

    test "filters by parent_goal_id", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child_goal, :space1, parent_goal: :goal1)
        |> Factory.log_in_person(:creator)

      # Query for children of goal1
      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{parent_goal_id: Paths.goal_id(ctx.goal1)})

      # Should return only the child goal
      assert length(res.work_map) == 1
      assert Enum.at(res.work_map, 0).id == Paths.goal_id(ctx.child_goal)
    end

    test "filters by owner_id", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:other_member)
        |> Factory.add_goal(:owned_goal, :space1, champion: :other_member)
        |> Factory.log_in_person(:creator)

      # Query for items owned by other_member
      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{champion_id: Paths.person_id(ctx.other_member)})

      # Should return only the owned goal
      assert length(res.work_map) == 1
      assert Enum.at(res.work_map, 0).id == Paths.goal_id(ctx.owned_goal)
    end

    test "filters by only_completed", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{only_completed: true})
      assert length(res.work_map) == 0

      ctx
      |> Factory.close_goal(:goal1)
      |> Factory.close_project(:project1)

      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{only_completed: true})
      assert length(res.work_map) == 2
    end

    test "returns flat list with parent relationships preserved", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:parent_goal, :space1)
        |> Factory.add_goal(:child_goal, :space1, parent_goal: :parent_goal)
        |> Factory.add_project(:child_project, :space1, goal: :child_goal)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{})

      # In a flat list, we should have all items
      assert length(res.work_map) >= 3

      # Find our test items
      parent_goal = Enum.find(res.work_map, &(&1.id == Paths.goal_id(ctx.parent_goal)))
      child_goal = Enum.find(res.work_map, &(&1.id == Paths.goal_id(ctx.child_goal)))
      child_project = Enum.find(res.work_map, &(&1.id == Paths.project_id(ctx.child_project)))

      # Verify parent relationships
      assert child_goal.parent_id == ctx.parent_goal.id
      assert child_project.parent_id == ctx.child_goal.id

      # Items in flat list should not have children
      assert parent_goal.children == []
      assert child_goal.children == []
      assert child_project.children == []
    end

    test "successfully returns item without owner", ctx do
      ctx =
        ctx
        |> Factory.log_in_person(:creator)
        |> Factory.add_company_member(:champion)
        |> Factory.add_space(:space4)
        |> Factory.add_project(:project3, :space4, champion: :champion)

      assert {200, %{work_map: [item]}} = query(ctx.conn, :get_flat_work_map, %{space_id: Paths.space_id(ctx.space4)})

      assert item.id == Paths.project_id(ctx.project3)
      assert item.owner.id == Paths.person_id(ctx.champion)
      assert item.owner_path == Paths.person_path(ctx.company, ctx.champion)

      Factory.suspend_company_member(ctx, :champion)

      assert {200, %{work_map: [item]}} = query(ctx.conn, :get_flat_work_map, %{space_id: Paths.space_id(ctx.space4)})

      assert item.id == Paths.project_id(ctx.project3)
      refute item.owner
      refute item.owner_path
    end
  end

  describe "functionality - include_tasks" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:assignee)
      |> Factory.add_company_member(:other_person)
      |> Factory.add_space_member(:assignee_space_member, :space, person: :assignee)
      |> Factory.add_space_member(:other_space_member, :space, person: :other_person)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:open_task, :milestone)
      |> Factory.add_task_assignee(:open_task_assignee, :open_task, :assignee)
      |> Factory.create_space_task(:space_task, :space)
      |> Factory.add_task_assignee(:space_task_assignee, :space_task, :assignee)
      |> Factory.add_project_task(:closed_task, :milestone)
      |> Factory.add_task_assignee(:closed_task_assignee, :closed_task, :assignee)
      |> Factory.add_project_task(:other_assignee_task, :milestone)
      |> Factory.add_task_assignee(:other_task_assignee, :other_assignee_task, :other_person)
      |> then(fn ctx ->
        {:ok, closed_task} = Operately.Tasks.update_task(ctx.closed_task, %{task_status: %{id: Ecto.UUID.generate(), label: "Done", color: :green, index: 0, value: "done", closed: true}})
        Map.put(ctx, :closed_task, closed_task)
      end)
    end

    test "does not include tasks by default", ctx do
      ctx = Factory.log_in_person(ctx, :assignee)

      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{})
      refute Enum.any?(res.work_map, fn item -> item.type == "task" end)
    end

    test "includes only open tasks assigned to the requester when include_tasks is true", ctx do
      ctx = Factory.log_in_person(ctx, :assignee)

      assert {200, res} = query(ctx.conn, :get_flat_work_map, %{include_tasks: true})

      task_items = Enum.filter(res.work_map, fn item -> item.type == "task" end)
      assert length(task_items) == 2

      open_task = Enum.find(task_items, fn item -> item.id == Paths.task_id(ctx.open_task) end)
      assert open_task
      assert open_task.parent_id == ctx.project.id

      space_task = Enum.find(task_items, fn item -> item.id == Paths.task_id(ctx.space_task) end)
      assert space_task
      assert is_nil(space_task.parent_id)

      assert open_task.owner.id == Paths.person_id(ctx.assignee)
    end
  end
end
