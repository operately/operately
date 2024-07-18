defmodule OperatelyWeb.Api.Queries.GetAssignmentsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures
  import Operately.UpdatesFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Updates.Update
  alias Operately.Projects.{Project, CheckIn}

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_assignments, %{})
    end
  end

  describe "get_due_assignments" do
    setup :register_and_log_in_account

    test "get_due_projects", ctx do
      today_project = create_project(ctx, DateTime.utc_now(), %{name: "today"})
      due_project = create_project(ctx, past_date(), %{name: "3 days ago"})
      create_project(ctx, upcoming_date())

      # Projects for another person
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      create_project(ctx, past_date(), %{creator_id: another_person.id})
      create_project(ctx, upcoming_date(), %{creator_id: another_person.id})

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(Project, :count, :id) == 5
      assert length(assignments) == 2

      [p1, p2] = assignments

      assert p1.id == Paths.project_id(today_project)
      assert p1.name == "today"
      assert p1.due
      assert p1.type == "project"
      assert p2.id == Paths.project_id(due_project)
      assert p2.name == "3 days ago"
      assert p2.due
      assert p2.type == "project"
    end

    test "get_due_projects ignores closed projects", ctx do
      create_project(ctx, upcoming_date())
      create_project(ctx, past_date()) |> close_project()
      due_project = create_project(ctx, past_date(), %{name: "single project"})

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(Project, :count, :id) == 3
      assert length(assignments) == 1

      [p] = assignments

      assert p.id == Paths.project_id(due_project)
      assert p.name == "single project"
      assert p.due
      assert p.type == "project"
    end

    test "get_due_goals", ctx do
      today_goal = create_goal(ctx.person, ctx.company, DateTime.utc_now(), %{name: "today"})
      due_goal = create_goal(ctx.person, ctx.company, past_date(), %{name: "3 days ago"})
      create_goal(ctx.person, ctx.company, upcoming_date())

      # Goals for another person
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      create_goal(another_person, ctx.company, past_date())
      create_goal(another_person, ctx.company, upcoming_date())

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(Goal, :count, :id) == 5
      assert length(assignments) == 2

      [g1, g2] = assignments

      assert g1.id == Paths.goal_id(today_goal)
      assert g1.name == "today"
      assert g1.due
      assert g1.type == "goal"
      assert g2.id == Paths.goal_id(due_goal)
      assert g2.name == "3 days ago"
      assert g2.due
      assert g2.type == "goal"
    end

    test "get_due_goals ignores closed goals", ctx do
      create_goal(ctx.person, ctx.company, upcoming_date())
      create_goal(ctx.person, ctx.company, past_date()) |> close_goal()
      due_goal = create_goal(ctx.person, ctx.company, past_date(), %{name: "single goal"})

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(Goal, :count, :id) == 3
      assert length(assignments) == 1

      [g] = assignments

      assert g.id == Paths.goal_id(due_goal)
      assert g.name == "single goal"
      assert g.due
      assert g.type == "goal"
    end

    test "get_due_project_check_ins", ctx do
      another_person = person_fixture_with_account(%{full_name: "champion", company_id: ctx.company.id})
      project = create_project(ctx, upcoming_date(), %{
        name: "project",
        reviewer_id: ctx.person.id,
        champion_id: another_person.id,
      })
      check_in1 = create_check_in(project)
      check_in2 = create_check_in(project)

      # Check-ins for another person
      another_project = create_project(ctx, upcoming_date(), %{reviewer_id: another_person.id, champion_id: ctx.person.id})
      create_check_in(another_project)
      create_check_in(another_project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(CheckIn, :count, :id) == 4
      assert length(assignments) == 2

      [c1, c2] = assignments

      assert c1.id == Paths.project_check_in_id(check_in2)
      assert c1.name == "project"
      assert c1.due
      assert c1.type == "check_in"
      assert c1.champion_id == another_person.id
      assert c1.champion_name == "champion"

      assert c2.id == Paths.project_check_in_id(check_in1)
      assert c2.name == "project"
      assert c2.due
      assert c2.type == "check_in"
      assert c2.champion_id == another_person.id
      assert c2.champion_name == "champion"
    end

    test "get_due_goal_updates", ctx do
      another_person = person_fixture_with_account(%{full_name: "champion", company_id: ctx.company.id})
      goal = create_goal(ctx.person, ctx.company, upcoming_date(), %{
        name: "goal",
        reviewer_id: ctx.person.id,
        champion_id: another_person.id,
      })

      update1 = create_update(goal)
      update2 = create_update(goal)

      # Updates for another person
      another_goal = create_goal(another_person, ctx.company, upcoming_date(), %{reviewer_id: another_person.id})
      create_update(another_goal)
      create_update(another_goal)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(Update, :count, :id) == 4
      assert length(assignments) == 2

      [u1, u2] = assignments

      assert u1.id == Paths.goal_update_id(update2)
      assert u1.name == "goal"
      assert u1.due
      assert u1.type == "goal_update"
      assert u1.champion_id == another_person.id
      assert u1.champion_name == "champion"

      assert u2.id == Paths.goal_update_id(update1)
      assert u2.name == "goal"
      assert u2.due
      assert u2.type == "goal_update"
      assert u2.champion_id == another_person.id
      assert u2.champion_name == "champion"
    end
  end

  #
  # Helpers
  #

  defp upcoming_date do
    Date.utc_today()
    |> Date.add(3)
    |> Operately.Time.as_datetime()
  end

  defp past_date do
    Date.utc_today()
    |> Date.add(-3)
    |> Operately.Time.as_datetime()
  end

  defp create_project(ctx, date, attrs \\ %{}) do
    {:ok, project} =
      project_fixture(Map.merge(%{
        creator_id: ctx.person.id,
        company_id: ctx.company.id,
        group_id: ctx.company.company_space_id,
      }, attrs))
      |> Project.changeset(%{next_check_in_scheduled_at: date})
      |> Repo.update()

    project
  end

  defp close_project(project) do
    {:ok, project} =
      Project.changeset(project, %{
        status: "closed",
        closed_at: DateTime.utc_now(),
        closed_by_id: project.creator_id,
      })
      |> Repo.update()

    project
  end

  defp create_goal(person, company, date, attrs \\ %{}) do
    {:ok, goal} =
      goal_fixture(person, Map.merge(%{space_id: company.company_space_id}, attrs))
      |> Goal.changeset(%{next_update_scheduled_at: date})
      |> Repo.update()

    goal
  end

  defp close_goal(goal) do
    {:ok, goal} =
      Goal.changeset(goal, %{
        closed_at: DateTime.utc_now(),
        closed_by_id: goal.creator_id,
      })
      |> Repo.update()

    goal
  end

  defp create_check_in(project) do
    project = Repo.preload(project, :champion)
    check_in_fixture(%{
      author_id: project.champion.id,
      project_id: project.id,
    })
  end

  defp create_update(goal) do
    update_fixture(%{
      updatable_type: :goal,
      updatable_id: goal.id,
      author_id: goal.champion_id,
      type: :goal_check_in,
    })
    |> Repo.reload()
  end
end
