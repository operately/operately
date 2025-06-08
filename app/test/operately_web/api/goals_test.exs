defmodule OperatelyWeb.Api.GoalsTest do
  alias Operately.Support.RichText
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal, :marketing)
  end

  describe "get discussions" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:goals, :get_discussions], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:goals, :get_discussions], %{})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      goal_id = Ecto.UUID.generate() |> Paths.goal_id()
      assert {404, res} = query(ctx.conn, [:goals, :get_discussions], %{goal_id: goal_id})
      assert res.message == "Goal not found"
    end

    test "it returns discussions for the goal", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal_discussion(ctx, :discussion, :goal)

      assert {200, res} = query(ctx.conn, [:goals, :get_discussions], %{goal_id: Paths.goal_id(ctx.goal)})
      assert length(res.discussions) == 1
    end
  end

  describe "update name" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_name], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_name], %{name: "test"})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it requires a name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_name], %{goal_id: "test"})
      assert res.message == "Missing required fields: name"
    end

    test "it updates the name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:goals, :update_name], %{goal_id: Paths.goal_id(ctx.goal), name: "New Name"})
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.name == "New Name"
    end
  end

  describe "update description" do
    @content Jason.encode!(RichText.rich_text("Test"))

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_description], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_description], %{description: @content})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it requires a description", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_description], %{goal_id: "test"})
      assert res.message == "Missing required fields: description"
    end

    test "it updates the description", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:goals, :update_description], %{goal_id: Paths.goal_id(ctx.goal), description: @content})
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.description == Jason.decode!(@content)
    end
  end

  describe "update due date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_due_date], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_due_date], %{due_date: "2023-01-01"})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it updates the due date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:goals, :update_due_date], %{goal_id: Paths.goal_id(ctx.goal), due_date: "2026-01-01"})
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.timeframe.end_date == ~D[2026-01-01]
    end

    test "it can update the due date to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:goals, :update_due_date], %{goal_id: Paths.goal_id(ctx.goal), due_date: nil})
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.timeframe == nil
    end
  end

  describe "add target" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :add_target], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :add_target], %{})
      assert res.message == "Missing required fields: goal_id, name, start_value, target_value, unit"
    end

    test "it adds a target to the goal", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        name: "New Target",
        start_value: 0,
        target_value: 100,
        unit: "USD"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :add_target], inputs)
      assert res.success == true

      target = Repo.get(Operately.Goals.Target, res.target_id)

      assert target.name == inputs.name
      assert target.from == inputs.start_value
      assert target.to == inputs.target_value
      assert target.unit == inputs.unit
      assert target.goal_id == ctx.goal.id
      assert target.value == inputs.start_value
    end
  end

  describe "delete target" do
    setup ctx do
      Factory.add_goal_target(ctx, :target, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :delete_target], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :delete_target], %{})
      assert res.message == "Missing required fields: goal_id, target_id"
    end

    test "it deletes the target", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Paths.target_id(ctx.target)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :delete_target], inputs)
      assert res.success == true

      assert Repo.get(Operately.Goals.Target, ctx.target.id) == nil
    end

    test "it returns 404 if target does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Ecto.UUID.generate() |> Paths.target_id()
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :delete_target], inputs)
      assert res.message == "Target not found"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        target_id: Paths.target_id(ctx.target)
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :delete_target], inputs)
      assert res.message == "Goal not found"
    end
  end

  describe "update target value" do
    setup ctx do
      Factory.add_goal_target(ctx, :target, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_target_value], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_target_value], %{})
      assert res.message == "Missing required fields: goal_id, target_id, value"
    end

    test "it returns 404 if target does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Ecto.UUID.generate() |> Paths.target_id(),
        value: 42
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target_value], inputs)
      assert res.message == "Target not found"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        target_id: Paths.target_id(ctx.target),
        value: 42
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target_value], inputs)
      assert res.message == "Goal not found"
    end

    test "it updates the target value", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Paths.target_id(ctx.target),
        value: 55
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_target_value], inputs)
      assert res.success == true

      target = Repo.get(Operately.Goals.Target, ctx.target.id)
      assert target.value == 55
    end
  end

  describe "update target" do
    setup ctx do
      Factory.add_goal_target(ctx, :target, :goal)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_target], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_target], %{})
      assert res.message == "Missing required fields: goal_id, target_id"
    end

    test "it returns 404 if target does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Ecto.UUID.generate() |> Paths.target_id(),
        name: "Updated Target",
        start_value: 10,
        target_value: 200,
        unit: "EUR"
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target], inputs)
      assert res.message == "Target not found"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        target_id: Paths.target_id(ctx.target),
        name: "Updated Target",
        start_value: 10,
        target_value: 200,
        unit: "EUR"
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target], inputs)
      assert res.message == "Goal not found"
    end

    test "it updates the target", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Paths.target_id(ctx.target),
        name: "Updated Target",
        start_value: 10,
        target_value: 200,
        unit: "EUR"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_target], inputs)
      assert res.success == true

      target = Repo.get(Operately.Goals.Target, ctx.target.id)
      assert target.name == "Updated Target"
      assert target.from == 10
      assert target.to == 200
      assert target.unit == "EUR"
    end
  end

  describe "update target index" do
    setup ctx do
      targets = Operately.Repo.preload(ctx.goal, :targets).targets |> Enum.sort_by(& &1.index)

      ctx
      |> Map.put(:target1, Enum.at(targets, 0))
      |> Map.put(:target2, Enum.at(targets, 1))
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_target_index], %{})
    end

    test "it fails if required fields are missing", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_target_index], %{})
      assert res.message == "Missing required fields: goal_id, target_id, index"
    end

    test "it returns 404 if target does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        target_id: Ecto.UUID.generate() |> Paths.target_id(),
        index: 1
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target_index], inputs)
      assert res.message == "Target not found"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(Ecto.UUID.generate()),
        target_id: Paths.target_id(ctx.target1),
        index: 1
      }

      assert {404, res} = mutation(ctx.conn, [:goals, :update_target_index], inputs)
      assert res.message == "Goal not found"
    end

    test "it updates the target index", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal_target(ctx, :target3, :goal)
      ctx = Factory.reload(ctx, :goal)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), target_id: Paths.target_id(ctx.target3)}

      # moving target3 to the first position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_target_index], Map.put(inputs, :index, 0))
      assert res.success == true
      assert target_order(ctx.goal.id) == [ctx.target3.id, ctx.target1.id, ctx.target2.id]

      # moving target3 to the second position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_target_index], Map.put(inputs, :index, 1))
      assert res.success == true
      assert target_order(ctx.goal.id) == [ctx.target1.id, ctx.target3.id, ctx.target2.id]

      # moving target3 to the last position
      assert {200, res} = mutation(ctx.conn, [:goals, :update_target_index], Map.put(inputs, :index, 2))
      assert res.success == true
      assert target_order(ctx.goal.id) == [ctx.target1.id, ctx.target2.id, ctx.target3.id]
    end

    defp target_order(goal_id) do
      Operately.Goals.Target
      |> Operately.Repo.all(where: [goal_id: goal_id])
      |> Enum.sort_by(& &1.index)
      |> Enum.map(& &1.id)
    end
  end

  describe "update champion" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_champion], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_champion], %{champion_id: "test"})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it updates the champion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_company_member(ctx, :new_champion)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        champion_id: Paths.person_id(ctx.new_champion)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_champion], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.champion_id == ctx.new_champion.id
    end

    test "it can remove the champion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        champion_id: nil
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_champion], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.champion_id == nil
    end
  end

  describe "update_reviewer" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_reviewer], %{})
    end

    test "it requires a goal_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :update_reviewer], %{reviewer_id: "test"})
      assert res.message == "Missing required fields: goal_id"
    end

    test "it updates the reviewer", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_company_member(ctx, :new_reviewer)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        reviewer_id: Paths.person_id(ctx.new_reviewer)
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_reviewer], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.reviewer_id == ctx.new_reviewer.id
    end

    test "it can remove the reviewer", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        reviewer_id: nil
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :update_reviewer], inputs)
      assert res.success == true

      ctx = Factory.reload(ctx, :goal)
      assert ctx.goal.reviewer_id == nil
    end
  end
end
