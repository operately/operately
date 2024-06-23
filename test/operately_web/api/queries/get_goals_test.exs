defmodule OperatelyWeb.Api.Queries.GetGoalsTest do
  use OperatelyWeb.TurboCase

  import Operately.GoalsFixtures
  import Operately.UpdatesFixtures
  import OperatelyWeb.Api.Serializer

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_goals, %{})
    end
  end

  describe "get_goals functionality" do
    setup :register_and_log_in_account

    test "include_last_check_in", ctx do
      goal1 = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)
      goal2 = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      update1 = update_fixture(%{type: :goal_check_in, updatable_id: goal1.id, updatable_type: :goal, author_id: ctx.person.id})
      update2 = update_fixture(%{type: :goal_check_in, updatable_id: goal1.id, updatable_type: :goal, author_id: ctx.person.id})

      update3 = update_fixture(%{type: :goal_check_in, updatable_id: goal2.id, updatable_type: :goal, author_id: ctx.person.id})
      update4 = update_fixture(%{type: :goal_check_in, updatable_id: goal2.id, updatable_type: :goal, author_id: ctx.person.id})

      assert {200, res} = query(ctx.conn, :get_goals, %{include_last_check_in: true})
      assert length(res.goals) == 2
      assert Enum.at(res.goals, 0).last_check_in == serialize(update1, level: :essential)
      assert Enum.at(res.goals, 1).last_check_in == serialize(update3, level: :essential)
    end

    test "include_parent_goal", ctx do
      parent_goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id, parent_goal_id: parent_goal.id)

      assert {200, res} = query(ctx.conn, :get_goals, %{include_parent_goal: true})
      assert length(res.goals) == 2
      assert Enum.find(res.goals, fn g -> g.id == parent_goal.id end).parent_goal == nil
      assert Enum.find(res.goals, fn g -> g.id == goal.id end).parent_goal == serialize(parent_goal, level: :essential)
    end
  end
end 
