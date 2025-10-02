defmodule OperatelyWeb.Api.GoalChecksTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal, :marketing)
  end

  describe "add" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :add_check], %{})
    end

    test "it requires a goal_id and name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :add_check], %{})
      assert res.message == "Missing required fields: goal_id, name"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      goal_id = Ecto.UUID.generate() |> Paths.goal_id()
      assert {404, res} = mutation(ctx.conn, [:goals, :add_check], %{goal_id: goal_id, name: "Test Check"})
      assert res.message == "Goal not found"
    end

    test "it adds a check to the goal", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        name: "New Check"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :add_check], inputs)
      assert res.success == true
      assert res.check_id != nil

      check = Repo.get(Operately.Goals.Check, Paths.decode_id(res.check_id))

      assert check.name == inputs.name
      assert check.goal_id == ctx.goal.id
      assert check.creator_id == ctx.creator.id
      assert check.completed == false
      assert check.completed_at == nil
      assert check.index == 1
    end

    test "it sets the correct index for multiple checks", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Add first check
      inputs1 = %{goal_id: Paths.goal_id(ctx.goal), name: "First Check"}
      assert {200, res1} = mutation(ctx.conn, [:goals, :add_check], inputs1)
      check1 = Repo.get(Operately.Goals.Check, Paths.decode_id(res1.check_id))
      assert check1.index == 1

      # Add second check
      inputs2 = %{goal_id: Paths.goal_id(ctx.goal), name: "Second Check"}
      assert {200, res2} = mutation(ctx.conn, [:goals, :add_check], inputs2)
      check2 = Repo.get(Operately.Goals.Check, Paths.decode_id(res2.check_id))
      assert check2.index == 2
    end

    test "it requires edit permission on the goal", ctx do
      ctx = Factory.add_company_member(ctx, :viewer)
      ctx = Factory.log_in_person(ctx, :viewer)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        name: "New Check"
      }

      assert {403, res} = mutation(ctx.conn, [:goals, :add_check], inputs)
      assert res.message == "You don't have permission to perform this action"
    end
  end

  describe "delete" do
    setup ctx do
      Factory.add_goal_check(ctx, :check, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :delete_check], %{})
    end

    test "it requires a goal_id and check_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :delete_check], %{})
      assert res.message == "Missing required fields: goal_id, check_id"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        check_id: Paths.goal_check_id(ctx.check)
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :delete_check], inputs)
      assert res.message == "Goal not found"
    end

    test "it returns 404 if check does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Ecto.UUID.generate() |> Paths.goal_check_id()
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :delete_check], inputs)
      assert res.message == "Check not found"
    end

    test "it deletes the check", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Paths.goal_check_id(ctx.check)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :delete_check], inputs)
      assert res.success == true

      assert Repo.get(Operately.Goals.Check, ctx.check.id) == nil
    end

    test "it requires edit permission on the goal", ctx do
      ctx = Factory.add_company_member(ctx, :viewer)
      ctx = Factory.log_in_person(ctx, :viewer)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Paths.goal_check_id(ctx.check)
      }

      assert {403, res} = mutation(ctx.conn, [:goals, :delete_check], inputs)
      assert res.message == "You don't have permission to perform this action"
    end
  end

  describe "update" do
    setup ctx do
      Factory.add_goal_check(ctx, :check, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_check], %{})
    end

    test "it requires a goal_id, check_id and name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_check], %{})
      assert res.message == "Missing required fields: goal_id, check_id, name"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        check_id: Paths.goal_check_id(ctx.check),
        name: "Updated Check"
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_check], inputs)
      assert res.message == "Goal not found"
    end

    test "it returns 404 if check does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Ecto.UUID.generate() |> Paths.goal_check_id(),
        name: "Updated Check"
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_check], inputs)
      assert res.message == "Check not found"
    end

    test "it updates the check name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Paths.goal_check_id(ctx.check),
        name: "Updated Check Name"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_check], inputs)
      assert res.success == true

      check = Repo.get(Operately.Goals.Check, ctx.check.id)
      assert check.name == "Updated Check Name"
    end

    test "it requires edit permission on the goal", ctx do
      ctx = Factory.add_company_member(ctx, :viewer)
      ctx = Factory.log_in_person(ctx, :viewer)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Paths.goal_check_id(ctx.check),
        name: "Updated Check"
      }

      assert {403, res} = mutation(ctx.conn, [:goals, :update_check], inputs)
      assert res.message == "You don't have permission to perform this action"
    end
  end

  describe "update index" do
    setup ctx do
      ctx = Factory.add_goal_check(ctx, :check1, :goal)
      ctx = Factory.add_goal_check(ctx, :check2, :goal)
      ctx = Factory.add_goal_check(ctx, :check3, :goal)

      checks = Operately.Repo.preload(ctx.goal, :checks).checks |> Enum.sort_by(& &1.index)

      ctx
      |> Map.put(:check1, Enum.at(checks, 0))
      |> Map.put(:check2, Enum.at(checks, 1))
      |> Map.put(:check3, Enum.at(checks, 2))
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_check_index], %{})
    end

    test "it requires a goal_id, check_id and index", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_check_index], %{})
      assert res.message == "Missing required fields: goal_id, check_id, index"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        check_id: Paths.goal_check_id(ctx.check1),
        index: 1
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_check_index], inputs)
      assert res.message == "Goal not found"
    end

    test "it returns 404 if check does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Ecto.UUID.generate() |> Paths.goal_check_id(),
        index: 1
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_check_index], inputs)
      assert res.message == "Check not found"
    end

    test "it updates the check index", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), check_id: Paths.goal_check_id(ctx.check3)}

      # moving check3 to the first position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_check_index], Map.put(inputs, :index, 0))
      assert res.success == true
      assert check_order(ctx.goal.id) == [ctx.check3.id, ctx.check1.id, ctx.check2.id]

      # moving check3 to the second position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_check_index], Map.put(inputs, :index, 1))
      assert res.success == true
      assert check_order(ctx.goal.id) == [ctx.check1.id, ctx.check3.id, ctx.check2.id]

      # moving check3 to the last position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_check_index], Map.put(inputs, :index, 2))
      assert res.success == true
      assert check_order(ctx.goal.id) == [ctx.check1.id, ctx.check2.id, ctx.check3.id]
    end

    test "it requires edit permission on the goal", ctx do
      ctx = Factory.add_company_member(ctx, :viewer)
      ctx = Factory.log_in_person(ctx, :viewer)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Paths.goal_check_id(ctx.check1),
        index: 1
      }

      assert {403, res} = mutation(ctx.conn, [:goals, :update_check_index], inputs)
      assert res.message == "You don't have permission to perform this action"
    end

    defp check_order(goal_id) do
      Operately.Goals.Check
      |> Operately.Repo.all(where: [goal_id: goal_id])
      |> Enum.sort_by(& &1.index)
      |> Enum.map(& &1.id)
    end
  end

  describe "toggle" do
    setup ctx do
      Factory.add_goal_check(ctx, :check, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :toggle_check], %{})
    end

    test "it requires a goal_id and check_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :toggle_check], %{})
      assert res.message == "Missing required fields: goal_id, check_id"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        check_id: Paths.goal_check_id(ctx.check)
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :toggle_check], inputs)
      assert res.message == "Goal not found"
    end

    test "it returns 404 if check does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Ecto.UUID.generate() |> Paths.goal_check_id()
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :toggle_check], inputs)
      assert res.message == "Check not found"
    end

    test "it toggles check from false to true", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Ensure check is initially false and completed_at is nil
      assert ctx.check.completed == false
      assert ctx.check.completed_at == nil

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Paths.goal_check_id(ctx.check)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :toggle_check], inputs)
      assert res.success == true

      check = Repo.get(Operately.Goals.Check, ctx.check.id)
      assert check.completed == true
      assert check.completed_at != nil
      assert DateTime.diff(check.completed_at, DateTime.utc_now(), :second) < 5
    end

    test "it toggles check from true to false", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Set check to completed first with a completed_at timestamp
      completed_at = DateTime.utc_now()
      {:ok, updated_check} = Operately.Repo.update(Operately.Goals.Check.changeset(ctx.check, %{completed: true, completed_at: completed_at}))
      ctx = Map.put(ctx, :check, updated_check)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Paths.goal_check_id(ctx.check)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :toggle_check], inputs)
      assert res.success == true

      check = Repo.get(Operately.Goals.Check, ctx.check.id)
      assert check.completed == false
      assert check.completed_at == nil
    end

    test "it requires edit permission on the goal", ctx do
      ctx = Factory.add_company_member(ctx, :viewer)
      ctx = Factory.log_in_person(ctx, :viewer)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        check_id: Paths.goal_check_id(ctx.check)
      }

      assert {403, res} = mutation(ctx.conn, [:goals, :toggle_check], inputs)
      assert res.message == "You don't have permission to perform this action"
    end
  end
end
