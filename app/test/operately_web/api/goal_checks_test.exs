defmodule OperatelyWeb.Api.GoalChecksTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Goals.Check

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal, :marketing)
  end

  describe "create" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :create_check], %{})
    end

    test "it requires a goal_id and name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:goals, :create_check], %{})
      assert res.message == "Missing required fields: goal_id, name"
    end

    test "it returns 404 if the goal does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      goal_id = Ecto.UUID.generate() |> Paths.goal_id()
      assert {404, res} = mutation(ctx.conn, [:goals, :create_check], %{goal_id: goal_id, name: "Test Check"})
      assert res.message == "Goal not found"
    end

    test "it adds a check to the goal", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{
        goal_id: Paths.goal_id(ctx.goal),
        name: "New Check"
      }

      assert {200, res} = mutation(ctx.conn, [:goals, :create_check], inputs)
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
      assert {200, res1} = mutation(ctx.conn, [:goals, :create_check], inputs1)
      check1 = Repo.get(Operately.Goals.Check, Paths.decode_id(res1.check_id))
      assert check1.index == 1

      # Add second check
      inputs2 = %{goal_id: Paths.goal_id(ctx.goal), name: "Second Check"}
      assert {200, res2} = mutation(ctx.conn, [:goals, :create_check], inputs2)
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

      assert {403, res} = mutation(ctx.conn, [:goals, :create_check], inputs)
      assert res.message == "You don't have permission to perform this action"
    end

    test "rejects oversized names without changing checks or activities through either API", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      ctx = Factory.add_api_token(ctx, :token, :creator, read_only: false)
      activities_before = Repo.aggregate(Activity, :count)

      for name <- [String.duplicate("a", 256), String.duplicate("e\u0301", 128)] do
        inputs = %{goal_id: Paths.goal_id(ctx.goal), name: name}
        assert {400, response} = mutation(ctx.conn, [:goals, :create_check], inputs)
        assert response.message =~ "255"
        assert {400, _} = external_mutation(Phoenix.ConnTest.build_conn(), ctx.token, "goals/create_check", inputs)
        assert Repo.aggregate(Check, :count) == 0
        assert Repo.aggregate(Activity, :count) == activities_before
      end
    end

    test "accepts 255 Unicode characters", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      name = String.duplicate("😀", 255)
      inputs = %{goal_id: Paths.goal_id(ctx.goal), name: name}
      assert {200, _} = mutation(ctx.conn, [:goals, :create_check], inputs)
      assert Repo.get_by!(Check, goal_id: ctx.goal.id).name == name
    end

    test "rejects blank names as validation errors", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), name: "   "}
      assert {400, _} = mutation(ctx.conn, [:goals, :create_check], inputs)
      assert Repo.aggregate(Check, :count) == 0
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

    test "it rejects a check from another company without changes", ctx do
      ctx =
        ctx
        |> Factory.add_api_token(:token, :creator, read_only: false)
        |> Factory.log_in_person(:creator)

      other =
        %{}
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal, :space)
        |> Factory.add_goal_check(:check, :goal)

      assert {:error, :not_found} = Operately.Goals.Goal.get(ctx.creator, id: other.goal.id)

      goal_ids = [ctx.goal.id, other.goal.id]
      checks_query = from(c in Check, where: c.goal_id in ^goal_ids, order_by: c.id)
      checks_before = Repo.all(checks_query)
      activities_before = Repo.aggregate(Activity, :count)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), check_id: Paths.goal_check_id(other.check)}

      assert {404, _} = mutation(ctx.conn, [:goals, :delete_check], inputs)
      assert {404, _} = external_mutation(Phoenix.ConnTest.build_conn(), ctx.token, "goals/delete_check", inputs)
      assert Repo.all(checks_query) == checks_before
      assert Repo.aggregate(Activity, :count) == activities_before
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

    test "it rejects a check from another company without changes", ctx do
      ctx =
        ctx
        |> Factory.add_api_token(:token, :creator, read_only: false)
        |> Factory.log_in_person(:creator)

      other =
        %{}
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal, :space)
        |> Factory.add_goal_check(:check, :goal)

      assert {:error, :not_found} = Operately.Goals.Goal.get(ctx.creator, id: other.goal.id)

      goal_ids = [ctx.goal.id, other.goal.id]
      checks_query = from(c in Check, where: c.goal_id in ^goal_ids, order_by: c.id)
      checks_before = Repo.all(checks_query)
      activities_before = Repo.aggregate(Activity, :count)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), check_id: Paths.goal_check_id(other.check), name: "Unauthorized rename"}

      assert {404, _} = mutation(ctx.conn, [:goals, :update_check], inputs)
      assert {404, _} = external_mutation(Phoenix.ConnTest.build_conn(), ctx.token, "goals/update_check", inputs)
      assert Repo.all(checks_query) == checks_before
      assert Repo.aggregate(Activity, :count) == activities_before
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

    test "rejects oversized names without changing checks or activities through either API", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      ctx = Factory.add_api_token(ctx, :token, :creator, read_only: false)
      activities_before = Repo.aggregate(Activity, :count)

      for name <- [String.duplicate("a", 256), String.duplicate("e\u0301", 128)] do
        inputs = %{check_id: Paths.goal_check_id(ctx.check), goal_id: Paths.goal_id(ctx.goal), name: name}
        assert {400, response} = mutation(ctx.conn, [:goals, :update_check], inputs)
        assert response.message =~ "255"
        assert {400, _} = external_mutation(Phoenix.ConnTest.build_conn(), ctx.token, "goals/update_check", inputs)
        assert Repo.reload!(ctx.check).name == ctx.check.name
        assert Repo.aggregate(Activity, :count) == activities_before
      end
    end

    test "accepts 255 Unicode characters", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      name = String.duplicate("😀", 255)
      inputs = %{check_id: Paths.goal_check_id(ctx.check), goal_id: Paths.goal_id(ctx.goal), name: name}
      assert {200, _} = mutation(ctx.conn, [:goals, :update_check], inputs)
      assert Repo.reload!(ctx.check).name == name
    end

    test "rejects blank names as validation errors", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      inputs = %{check_id: Paths.goal_check_id(ctx.check), goal_id: Paths.goal_id(ctx.goal), name: "   "}
      assert {400, _} = mutation(ctx.conn, [:goals, :update_check], inputs)
      assert Repo.reload!(ctx.check).name == ctx.check.name
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

    test "it rejects a check from another company without changes", ctx do
      ctx =
        ctx
        |> Factory.add_api_token(:token, :creator, read_only: false)
        |> Factory.log_in_person(:creator)

      other =
        %{}
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal, :space)
        |> Factory.add_goal_check(:check, :goal)

      assert {:error, :not_found} = Operately.Goals.Goal.get(ctx.creator, id: other.goal.id)

      goal_ids = [ctx.goal.id, other.goal.id]
      checks_query = from(c in Check, where: c.goal_id in ^goal_ids, order_by: c.id)
      checks_before = Repo.all(checks_query)
      activities_before = Repo.aggregate(Activity, :count)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), check_id: Paths.goal_check_id(other.check), index: 0}

      assert {404, _} = mutation(ctx.conn, [:goals, :update_check_index], inputs)
      assert {404, _} = external_mutation(Phoenix.ConnTest.build_conn(), ctx.token, "goals/update_check_index", inputs)
      assert Repo.all(checks_query) == checks_before
      assert Repo.aggregate(Activity, :count) == activities_before
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
      from(c in Operately.Goals.Check, where: c.goal_id == ^goal_id)
      |> Operately.Repo.all()
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

    test "it rejects a check from another company without changes", ctx do
      ctx =
        ctx
        |> Factory.add_api_token(:token, :creator, read_only: false)
        |> Factory.log_in_person(:creator)

      other =
        %{}
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal, :space)
        |> Factory.add_goal_check(:check, :goal)

      assert {:error, :not_found} = Operately.Goals.Goal.get(ctx.creator, id: other.goal.id)

      goal_ids = [ctx.goal.id, other.goal.id]
      checks_query = from(c in Check, where: c.goal_id in ^goal_ids, order_by: c.id)
      checks_before = Repo.all(checks_query)
      activities_before = Repo.aggregate(Activity, :count)

      inputs = %{goal_id: Paths.goal_id(ctx.goal), check_id: Paths.goal_check_id(other.check)}

      assert {404, _} = mutation(ctx.conn, [:goals, :toggle_check], inputs)
      assert {404, _} = external_mutation(Phoenix.ConnTest.build_conn(), ctx.token, "goals/toggle_check", inputs)
      assert Repo.all(checks_query) == checks_before
      assert Repo.aggregate(Activity, :count) == activities_before
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
