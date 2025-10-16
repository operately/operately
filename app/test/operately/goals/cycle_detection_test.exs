defmodule Operately.Goals.CycleDetectionTest do
  use Operately.DataCase
  import Operately.GoalsFixtures
  alias Operately.Goals

  describe "goal hierarchy cycle detection" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
    end

    test "allows creating a goal without a parent", ctx do
      goal = goal_fixture(ctx.creator, %{space_id: ctx.space.id})
      assert goal.parent_goal_id == nil
    end

    test "allows creating a goal with a valid parent", ctx do
      grandparent = goal_fixture(ctx.creator, %{space_id: ctx.space.id})
      parent = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: grandparent.id})
      child = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: parent.id})

      assert child.parent_goal_id == parent.id
      assert parent.parent_goal_id == grandparent.id
    end

    test "allows changing a goal's parent to a valid new parent", ctx do
      original_parent = goal_fixture(ctx.creator, %{space_id: ctx.space.id})
      new_parent = goal_fixture(ctx.creator, %{space_id: ctx.space.id})
      goal = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: original_parent.id})

      assert goal.parent_goal_id == original_parent.id

      {:ok, goal} = Goals.update_goal(goal, %{parent_goal_id: new_parent.id})
      assert goal.parent_goal_id == new_parent.id
    end

    test "allows removing a goal's parent", ctx do
      parent = goal_fixture(ctx.creator, %{space_id: ctx.space.id})
      goal = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: parent.id})

      assert goal.parent_goal_id == parent.id

      {:ok, goal} = Goals.update_goal(goal, %{parent_goal_id: nil})
      assert goal.parent_goal_id == nil
    end

    test "prevents a goal from being its own parent", ctx do
      goal = goal_fixture(ctx.creator, %{space_id: ctx.space.id})

      assert_raise Postgrex.Error, ~r/Cycle detected/, fn ->
        Goals.update_goal(goal, %{parent_goal_id: goal.id})
      end
    end

    test "prevents direct cycles between two goals", ctx do
      goal_a = goal_fixture(ctx.creator, %{space_id: ctx.space.id})
      goal_b = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: goal_a.id})

      assert_raise Postgrex.Error, ~r/Cycle detected/, fn ->
        Goals.update_goal(goal_a, %{parent_goal_id: goal_b.id})
      end
    end

    test "prevents indirect cycles in a multi-level hierarchy", ctx do
      # Create a chain: A -> B -> C -> D
      goal_a = goal_fixture(ctx.creator, %{space_id: ctx.space.id})
      goal_b = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: goal_a.id})
      goal_c = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: goal_b.id})
      goal_d = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: goal_c.id})

      # Attempt to create cycle: A -> B -> C -> D -> A
      assert_raise Postgrex.Error, ~r/Cycle detected/, fn ->
        Goals.update_goal(goal_a, %{parent_goal_id: goal_d.id})
      end
    end

    test "prevents cycle when updating a goal in a complex hierarchy", ctx do
      # A
      # ├── B
      # │   └── C
      # └── D
      #     └── E
      goal_a = goal_fixture(ctx.creator, %{space_id: ctx.space.id})
      goal_b = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: goal_a.id})
      goal_c = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: goal_b.id})
      goal_d = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: goal_a.id})
      goal_e = goal_fixture(ctx.creator, %{space_id: ctx.space.id, parent_goal_id: goal_d.id})

      # Attempt to make A a child of C (would create A -> B -> C -> A)
      assert_raise Postgrex.Error, ~r/Cycle detected/, fn ->
        Goals.update_goal(goal_a, %{parent_goal_id: goal_c.id})
      end

      # Attempt to make A a child of E (would create A -> D -> E -> A)
      assert_raise Postgrex.Error, ~r/Cycle detected/, fn ->
        Goals.update_goal(goal_a, %{parent_goal_id: goal_e.id})
      end
    end
  end
end
