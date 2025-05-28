defmodule OperatelyWeb.Api.GoalsTest do
  alias Operately.Support.RichText
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal, :marketing)
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
end
