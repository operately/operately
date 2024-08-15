defmodule OperatelyWeb.Api.Queries.GetGoalTest do
  alias Operately.Support.RichText
  alias Operately.Access.Binding
  alias OperatelyWeb.Paths
  alias Operately.Repo

  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.UpdatesFixtures
  import Operately.ProjectsFixtures
  import OperatelyWeb.Api.Serializer
  import Ecto.Query, only: [from: 2]

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_goal, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    test "company members have no access", ctx do
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.no_access(),
      })
      goal_id = Paths.goal_id(goal)

      assert {404, %{message: msg} = _res} = query(ctx.conn, :get_goal, %{id: goal_id})
      assert msg == "The requested resource was not found"
    end

    test "company members have access", ctx do
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.view_access(),
      })
      goal_id = Paths.goal_id(goal)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal_id})
      assert res.goal.id == goal_id
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)

      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })
      goal_id = Paths.goal_id(goal)

      assert {404, %{message: msg} = _res} = query(ctx.conn, :get_goal, %{id: goal_id})
      assert msg == "The requested resource was not found"
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)

      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.view_access(),
      })
      goal_id = Paths.goal_id(goal)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: goal_id})
      assert res.goal.id == goal_id
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        champion_id: champion.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })
      goal_id = Paths.goal_id(goal)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {404, _} = query(ctx.conn, :get_goal, %{id: goal_id})
      assert {200, res} = query(conn, :get_goal, %{id: goal_id})
      assert res.goal.id == goal_id
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = goal_fixture(ctx.creator, %{
        space_id: ctx.space.id,
        reviewer_id: reviewer.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })
      goal_id = Paths.goal_id(goal)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {404, _} = query(ctx.conn, :get_goal, %{id: goal_id})
      assert {200, res} = query(conn, :get_goal, %{id: goal_id})
      assert res.goal.id == goal_id
    end
  end

  describe "get_goals functionality" do
    setup :register_and_log_in_account

    test "when id is not provided", ctx do
      assert query(ctx.conn, :get_goal, %{}) == bad_request_response()
    end

    test "when goal does not exist", ctx do
      id = "goal-abc-#{Operately.ShortUuid.encode!(Ecto.UUID.generate())}"

      assert query(ctx.conn, :get_goal, %{id: id}) == not_found_response()
    end

    test "with no includes", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)
      goal = Operately.Repo.preload(goal, [:parent_goal])

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal == serialize(goal, level: :full)
    end

    test "include_champion", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal.champion == nil

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_champion: true})
      assert res.goal.champion == serialize(ctx.person, level: :essential)
    end

    test "include_closed_by", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal.closed_by == nil

      # requested, but the goal is not closed
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_closed_by: true})
      assert res.goal.closed_by == nil

      retrospective = Jason.encode!(RichText.rich_text("Writing a retrospective"))
      {:ok, goal} = Operately.Operations.GoalClosing.run(ctx.person, goal, "success", retrospective)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_closed_by: true})
      assert res.goal.closed_by == serialize(ctx.person, level: :essential)
    end

    test "include_last_check_in", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal.last_check_in == nil

      # requested, but the goal has no check-ins
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_last_check_in: true})
      assert res.goal.last_check_in == nil

      update = update_fixture(%{type: :goal_check_in, updatable_id: goal.id, updatable_type: :goal, author_id: ctx.person.id})
      update = Operately.Repo.preload(update, [:author, [reactions: :author]])

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_last_check_in: true})
      assert res.goal.last_check_in == serialize(update, level: :full)
    end

    test "include_permissions", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal.permissions == nil

      permissions = Operately.Goals.Permissions.calculate(goal, ctx.person)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_permissions: true})
      assert res.goal.permissions == serialize(permissions, level: :full)
    end

    test "include_projects", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal.projects == nil

      # requested, but the goal has no projects
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_projects: true})
      assert res.goal.projects == []

      project1 = project_fixture(company_id: ctx.company.id, name: "Project 1", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)
      project2 = project_fixture(company_id: ctx.company.id, name: "Project 2", creator_id: ctx.person.id, group_id: ctx.company.company_space_id)

      Operately.Operations.ProjectGoalConnection.run(ctx.person, project1, goal)
      Operately.Operations.ProjectGoalConnection.run(ctx.person, project2, goal)

      project1 = Operately.Repo.one(from p in Operately.Projects.Project, where: p.id == ^project1.id, preload: [:champion, :reviewer])
      project2 = Operately.Repo.one(from p in Operately.Projects.Project, where: p.id == ^project2.id, preload: [:champion, :reviewer])

      # requested, but the goal has no projects
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_projects: true})
      assert length(res.goal.projects) == 2
      assert Enum.find(res.goal.projects, fn p -> p.id == Paths.project_id(project1) end) == serialize(project1, level: :full)
      assert Enum.find(res.goal.projects, fn p -> p.id == Paths.project_id(project2) end) == serialize(project2, level: :full)
    end

    test "include_reviewer", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal.reviewer == nil

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_reviewer: true})
      assert res.goal.reviewer == serialize(ctx.person, level: :essential)
    end

    test "include_space", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal.space == nil

      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_space: true})
      assert res.goal.space == serialize(space, level: :essential)
    end

    test "include_targets", ctx do
      goal = goal_fixture(ctx.person, company_id: ctx.company.id, space_id: ctx.company.company_space_id)

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      assert res.goal.targets == nil

      goal = Operately.Repo.preload(goal, :targets)

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_targets: true})
      assert res.goal.targets == serialize(goal.targets, level: :essential)
    end

    test "include_access_levels", ctx do
      space = group_fixture(ctx.person)
      goal = goal_fixture(ctx.person, %{
        company_id: ctx.company.id,
        space_id: space.id,
        anonymous_access_level: Binding.view_access(),
        company_access_level: Binding.edit_access(),
        space_access_level: Binding.full_access(),
      })

      # not requested
      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal)})
      refute res.goal.access_levels

      assert {200, res} = query(ctx.conn, :get_goal, %{id: Paths.goal_id(goal), include_access_levels: true})

      assert res.goal.access_levels.public == Binding.view_access()
      assert res.goal.access_levels.company == Binding.edit_access()
      assert res.goal.access_levels.space == Binding.full_access()
    end
  end

  #
  # Helpers
  #

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end
end
