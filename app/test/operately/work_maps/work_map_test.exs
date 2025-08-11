defmodule Operately.WorkMaps.WorkMapTest do
  use Operately.DataCase

  alias Operately.WorkMaps.WorkMap
  alias Operately.WorkMaps.WorkMapItem
  alias Operately.Support.Factory

  describe "build_hierarchy/1 with empty input" do
    test "returns empty list for empty input" do
      assert WorkMap.build_hierarchy([]) == []
    end
  end

  describe "build_hierarchy/1 with single item" do
    setup do
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_goal(:root_goal, :space)
      |> Factory.preload(:root_goal, [:last_update, :checks, :targets])
    end

    test "returns single root item unchanged", %{root_goal: root_goal} = ctx do
      [item] = to_work_map_items(ctx)
      [result] = WorkMap.build_hierarchy([item])

      assert result.id == root_goal.id
      assert result.children == []
    end
  end

  describe "build_hierarchy/1 with parent-child relationship" do
    setup do
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:child_goal, :space, parent_goal: :parent_goal)
      |> Factory.preload(:parent_goal, [:last_update, :targets, :checks])
      |> Factory.preload(:child_goal, [:last_update, :targets, :checks])
    end

    test "builds simple parent-child hierarchy", %{parent_goal: parent_goal, child_goal: child_goal} = ctx do
      items = to_work_map_items(ctx)
      [result] = WorkMap.build_hierarchy(items)

      # Should have one root item (parent_goal)
      assert result.id == parent_goal.id
      assert length(result.children) == 1

      # Child should be nested under parent
      [child] = result.children
      assert child.id == child_goal.id
      assert child.parent_id == parent_goal.id
    end
  end

  describe "build_hierarchy/1 with mixed goals and projects" do
    setup do
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:child_goal, :space, parent_goal: :parent_goal)
      |> Factory.preload(:parent_goal, [:targets, :last_update, :checks])
      |> Factory.preload(:child_goal, [:targets, :last_update, :checks])
      |> Factory.add_project(:goal_project, :space, goal: :parent_goal)
      |> Factory.add_project(:root_project, :space)
      |> Factory.preload(:goal_project, :milestones)
      |> Factory.preload(:goal_project, :last_check_in)
      |> Factory.preload(:root_project, :milestones)
      |> Factory.preload(:root_project, :last_check_in)
    end

    test "builds hierarchy with goals and projects", %{parent_goal: parent_goal, child_goal: child_goal, goal_project: goal_project, root_project: root_project} = ctx do
      items = to_work_map_items(ctx)
      result = WorkMap.build_hierarchy(items)

      # Should have two root items (parent_goal and root_project)
      assert length(result) == 2

      # Find the parent goal in results
      parent_goal_item = Enum.find(result, fn item -> item.id == parent_goal.id end)
      assert parent_goal_item

      # Parent goal should have two children (child_goal and goal_project)
      assert length(parent_goal_item.children) == 2

      # Verify child goal is in children
      child_goal_item = Enum.find(parent_goal_item.children, fn item -> item.id == child_goal.id end)
      assert child_goal_item

      # Verify project is in children
      project_item = Enum.find(parent_goal_item.children, fn item -> item.id == goal_project.id end)
      assert project_item

      # Find the root project in results
      root_project_item = Enum.find(result, fn item -> item.id == root_project.id end)
      assert root_project_item
      assert root_project_item.children == []
    end
  end

  describe "build_hierarchy/1 with deep nesting" do
    setup do
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_goal(:level1, :space)
      |> Factory.add_goal(:level2, :space, parent_goal: :level1)
      |> Factory.add_goal(:level3, :space, parent_goal: :level2)
      |> Factory.preload(:level1, [:last_update, :targets, :checks])
      |> Factory.preload(:level2, [:last_update, :targets, :checks])
      |> Factory.preload(:level3, [:last_update, :targets, :checks])
      |> Factory.add_project(:level3_project, :space, goal: :level3)
      |> Factory.preload(:level3_project, :milestones)
      |> Factory.preload(:level3_project, :last_check_in)
    end

    test "handles deep nesting with multiple levels", %{level1: level1, level2: level2, level3: level3, level3_project: level3_project} = ctx do
      items = to_work_map_items(ctx)
      [result] = WorkMap.build_hierarchy(items)

      # Level 1
      assert result.id == level1.id
      assert length(result.children) == 1

      # Level 2
      [level2_item] = result.children
      assert level2_item.id == level2.id
      assert length(level2_item.children) == 1

      # Level 3
      [level3_item] = level2_item.children
      assert level3_item.id == level3.id
      assert length(level3_item.children) == 1

      # Project at level 3
      [project] = level3_item.children
      assert project.id == level3_project.id
    end
  end

  describe "build_hierarchy/1 with orphaned items" do
    setup do
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:child_goal, :space, parent_goal: :parent_goal)
      |> Factory.preload(:parent_goal, [:last_update, :targets, :checks])
      |> Factory.preload(:child_goal, [:last_update, :targets, :checks])
    end

    test "handles orphaned items (parent not in list)", %{child_goal: child_goal, parent_goal: parent_goal} do
      # Only include the child goal, not the parent
      items = [WorkMapItem.build_item(child_goal, [], false)]
      [result] = WorkMap.build_hierarchy(items)

      # Child should be treated as a root item since parent is not in list
      assert result.id == child_goal.id
      # Still has parent_id
      assert result.parent_id == parent_goal.id
      assert result.children == []
    end
  end

  describe "build_hierarchy/1 with multiple root items" do
    setup do
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal1, :space)
      |> Factory.add_goal(:goal2, :space)
      |> Factory.preload(:goal1, [:last_update, :targets, :checks])
      |> Factory.preload(:goal2, [:last_update, :targets, :checks])
      |> Factory.add_project(:project1, :space)
      |> Factory.add_project(:project2, :space)
      |> Factory.preload(:project1, :milestones)
      |> Factory.preload(:project1, :last_check_in)
      |> Factory.preload(:project2, :milestones)
      |> Factory.preload(:project2, :last_check_in)
    end

    test "handles multiple root items", %{goal1: goal1, goal2: goal2, project1: project1, project2: project2} = ctx do
      items = to_work_map_items(ctx)
      result = WorkMap.build_hierarchy(items)

      # Should have 4 root items
      assert length(result) == 4

      # All should be root items with no children
      Enum.each(result, fn item ->
        assert item.children == []
      end)

      # All original items should be in the result
      item_ids = Enum.map(result, fn item -> item.id end)
      assert Enum.member?(item_ids, goal1.id)
      assert Enum.member?(item_ids, goal2.id)
      assert Enum.member?(item_ids, project1.id)
      assert Enum.member?(item_ids, project2.id)
    end
  end

  #
  # Helpers
  #

  defp to_work_map_items(ctx) do
    # Get all goals from context
    goals =
      ctx
      |> Map.keys()
      |> Enum.filter(fn key ->
        is_atom(key) &&
          is_map(ctx[key]) &&
          Map.has_key?(ctx[key], :__struct__) &&
          ctx[key].__struct__ == Operately.Goals.Goal
      end)
      |> Enum.map(fn key -> ctx[key] end)

    # Get all projects from context
    projects =
      ctx
      |> Map.keys()
      |> Enum.filter(fn key ->
        is_atom(key) &&
          is_map(ctx[key]) &&
          Map.has_key?(ctx[key], :__struct__) &&
          ctx[key].__struct__ == Operately.Projects.Project
      end)
      |> Enum.map(fn key -> ctx[key] end)

    # First convert goals to WorkMapItems (without children)
    goal_items = Enum.map(goals, fn goal -> WorkMapItem.build_item(goal, [], false) end)

    # Then convert projects to WorkMapItems
    project_items = Enum.map(projects, fn project -> WorkMapItem.build_item(project, [], false) end)

    # Return all items
    goal_items ++ project_items
  end
end
