defmodule OperatelyWeb.Api.Queries.GetGoalTest do
  alias Operately.Support.RichText
  use OperatelyWeb.TurboCase

  import Operately.GoalsFixtures
  import Operately.UpdatesFixtures
  import Operately.ProjectsFixtures
  import OperatelyWeb.Api.Serializer

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_goal, %{})
    end
  end

  describe "get_goals functionality" do
    setup :register_and_log_in_account

    test "when id is not provided", ctx do
      assert query(ctx.conn, :get_goal, %{}) == bad_request_response()
    end

    test "when goal does not exist", ctx do
      assert query(ctx.conn, :get_goal, %{id: Ecto.UUID.generate()}) == not_found_response()
    end

    test "with no includes", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal == serialize(goal, level: :full)
    end

    test "include_champion", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.champion == nil

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_champion: true})
      assert res.goal.champion == serialize(ctx.person, level: :essential)
    end

    test "include_closed_by", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.closed_by == nil

      # requested, but the goal is not closed
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_closed_by: true})
      assert res.goal.closed_by == nil

      retrospective = Jason.encode!(RichText.rich_text("Writing a retrospective"))
      {:ok, goal} = Operately.Operations.GoalClosing.run(ctx.person, goal.id, "success", retrospective)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_closed_by: true})
      assert res.goal.closed_by == serialize(ctx.person, level: :essential)
    end

    test "include_last_check_in", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.last_check_in == nil

      # requested, but the goal has no check-ins
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_last_check_in: true})
      assert res.goal.last_check_in == nil

      update = update_fixture(%{type: :goal_check_in, updatable_id: goal.id, updatable_type: :goal, author_id: ctx.person.id})
      update = Operately.Repo.preload(update, [:author, [reactions: :author]])

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_last_check_in: true})
      assert res.goal.last_check_in == serialize(update, level: :full)
    end

    test "include_parent_goal", ctx do
      parent_goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id, parent_goal_id: parent_goal.id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.parent_goal == nil

      # requested, but the goal has no parent goal
      assert {200, res} = query(ctx.conn, :get_goal, %{id: parent_goal.id, include_parent_goal: true})
      assert res.goal.parent_goal == nil

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_parent_goal: true})
      assert res.goal.parent_goal == serialize(parent_goal, level: :essential)
    end

    test "include_permissions", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.permissions == nil

      permissions = Operately.Goals.Permissions.calculate(goal, ctx.person)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_permissions: true})
      assert res.goal.permissions == serialize(permissions, level: :full)
    end

    test "include_projects", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.projects == nil

      # requested, but the goal has no projects
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_projects: true})
      assert res.goal.projects == []

      project1 = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)
      project2 = project_fixture(company_id: ctx.company.id, name: "Project 2", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)

      Operately.Operations.ProjectGoalConnection.run(ctx.person, project1, goal)
      Operately.Operations.ProjectGoalConnection.run(ctx.person, project2, goal)

      project1 = Operately.Repo.preload(project1, [:champion, :reviewer])
      project2 = Operately.Repo.preload(project2, [:champion, :reviewer])

      # requested, but the goal has no projects
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_projects: true})
      assert length(res.goal.projects) == 2
      assert Enum.find(res.goal.projects, fn p -> p.id == Paths.project_id(project1) end) == serialize(project1, level: :full)
      assert Enum.find(res.goal.projects, fn p -> p.id == Paths.project_id(project2) end) == serialize(project2, level: :full)
    end

    test "include_reviewer", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.reviewer == nil

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_reviewer: true})
      assert res.goal.reviewer == serialize(ctx.person, level: :essential)
    end

    test "include_space", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.space == nil

      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_space: true})
      assert res.goal.space == serialize(space, level: :essential)
    end

    test "include_targets", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id})
      assert res.goal.targets == nil

      goal = Operately.Repo.preload(goal, :targets)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal.id, include_targets: true})
      assert res.goal.targets == serialize(goal.targets, level: :essential)
    end
  end
end 
