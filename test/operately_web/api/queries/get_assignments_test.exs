defmodule OperatelyWeb.Api.Queries.GetAssignmentsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Goals, Projects}
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{Project, CheckIn}
  alias Operately.Support.RichText

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

      update1 = create_update(another_person, goal)
      update2 = create_update(another_person, goal)

      # Updates for another person
      another_goal = create_goal(another_person, ctx.company, upcoming_date(), %{reviewer_id: another_person.id})
      create_update(another_person, another_goal)
      create_update(another_person, another_goal)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(Update, :count, :id) == 4
      assert length(assignments) == 2

      u1 = Enum.find(assignments, &(&1.id == Paths.goal_update_id(update1)))
      assert u1.name == "goal"
      assert u1.due
      assert u1.type == "goal_update"
      assert u1.champion_id == another_person.id
      assert u1.champion_name == "champion"

      u2 = Enum.find(assignments, &(&1.id == Paths.goal_update_id(update2)))
      assert u2.name == "goal"
      assert u2.due
      assert u2.type == "goal_update"
      assert u2.champion_id == another_person.id
      assert u2.champion_name == "champion"
    end

    test "returns project check-in creator, not current champion", ctx do
      champion1 = person_fixture_with_account(%{full_name: "first", company_id: ctx.company.id})
      p = create_project(ctx, upcoming_date(), %{
        name: "project",
        reviewer_id: ctx.person.id,
        champion_id: champion1.id,
      })
      create_check_in(p)

      # Before updating champion
      assert {200, %{assignments: [check_in]}} = query(ctx.conn, :get_assignments, %{})
      assert check_in.champion_name == "first"
      assert check_in.champion_id == champion1.id

      # Update champion
      champion2 = person_fixture_with_account(%{full_name: "second", company_id: ctx.company.id})
      {:ok, _} = Projects.get_contributor!(person_id: champion1.id, project_id: p.id)
        |> Projects.update_contributor(%{person_id: champion2.id})

      # After updating champion
      assert {200, %{assignments: [check_in]}} = query(ctx.conn, :get_assignments, %{})
      assert check_in.champion_name == "first"
      assert check_in.champion_id == champion1.id
    end

    test "returns goal update creator, not current champion", ctx do
      champion1 = person_fixture_with_account(%{full_name: "first", company_id: ctx.company.id})
      goal = create_goal(ctx.person, ctx.company, upcoming_date(), %{
        name: "goal",
        reviewer_id: ctx.person.id,
        champion_id: champion1.id,
      })
      create_update(champion1, goal)

      # Before updating champion
      assert {200, %{assignments: [update]}} = query(ctx.conn, :get_assignments, %{})
      assert update.champion_name == "first"
      assert update.champion_id == champion1.id

      # Update champion
      champion2 = person_fixture_with_account(%{full_name: "second", company_id: ctx.company.id})
      {:ok, _} = Goals.update_goal(goal, %{champion_id: champion2.id})

      # After updating champion
      assert {200, %{assignments: [update]}} = query(ctx.conn, :get_assignments, %{})
      assert update.champion_name == "first"
      assert update.champion_id == champion1.id
    end
  end

  describe "get_due_assignments exclude soft-deleted" do
    setup :register_and_log_in_account

    test "projects", ctx do
      to_be_deleted = create_project(ctx, past_date())
      create_project(ctx, past_date())

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 2

      Repo.soft_delete(to_be_deleted)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 1
    end

    test "goals", ctx do
      to_be_deleted = create_goal(ctx.person, ctx.company, past_date())
      create_goal(ctx.person, ctx.company, past_date())

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 2

      Repo.soft_delete(to_be_deleted)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 1
    end

    test "project check-ins", ctx do
      p1 = create_project(ctx, upcoming_date())
      create_check_in(p1)
      create_check_in(p1)
      p2 = create_project(ctx, upcoming_date())
      create_check_in(p2)
      create_check_in(p2)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 4

      Repo.soft_delete(p2)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 2

      Repo.soft_delete(p1)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 0
    end

    test "goal updates", ctx do
      g1 = create_goal(ctx.person, ctx.company, upcoming_date())
      create_update(ctx.person, g1)
      create_update(ctx.person, g1)
      g2 = create_goal(ctx.person, ctx.company, upcoming_date())
      create_update(ctx.person, g2)
      create_update(ctx.person, g2)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 4

      Repo.soft_delete(g1)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 2

      Repo.soft_delete(g2)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 0
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

  defp create_update(creator, goal) do
    # update_fixture(%{
    #   updatable_type: :goal,
    #   updatable_id: goal.id,
    #   author_id: goal.champion_id,
    #   type: :goal_check_in,
    # })
    # |> Repo.reload()
    {:ok, update} = Operately.Operations.GoalCheckIn.run(creator, goal, RichText.rich_text("content"), [])
    update
  end
end
