defmodule OperatelyWeb.Api.Queries.GetAssignmentsCountTest do
  use OperatelyWeb.TurboCase

  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures
  import Operately.UpdatesFixtures

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Updates.Update
  alias Operately.Projects.{Project, CheckIn}

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_assignments_count, %{})
    end
  end

  describe "get_assignments_count" do
    setup :register_and_log_in_account

    test "counts due projects", ctx do
      create_project(ctx, DateTime.utc_now())
      create_project(ctx, past_date())
      create_project(ctx, upcoming_date())

      # Projects for another person
      another_ctx = register_and_log_in_account(ctx)
      create_project(another_ctx, past_date())
      create_project(another_ctx, upcoming_date())

      assert Repo.aggregate(Project, :count, :id) == 5

      assert {200, %{count: count} = _res} = query(ctx.conn, :get_assignments_count, %{})
      assert count == 2

      assert {200, %{count: count} = _res} = query(another_ctx.conn, :get_assignments_count, %{})
      assert count == 1
    end

    test "ignores closed projects", ctx do
      create_project(ctx, upcoming_date())
      create_project(ctx, past_date())
      create_project(ctx, past_date()) |> close_project()

      assert Repo.aggregate(Project, :count, :id) == 3

      assert {200, %{count: count} = _res} = query(ctx.conn, :get_assignments_count, %{})
      assert count == 1
    end

    test "counts due goals", ctx do
      create_goal(ctx, DateTime.utc_now())
      create_goal(ctx, past_date())
      create_goal(ctx, upcoming_date())

      # Goals for another person
      another_ctx = register_and_log_in_account(ctx)
      create_goal(another_ctx, past_date())
      create_goal(another_ctx, upcoming_date())

      assert Repo.aggregate(Goal, :count, :id) == 5

      assert {200, %{count: count} = _res} = query(ctx.conn, :get_assignments_count, %{})
      assert count == 2

      assert {200, %{count: count} = _res} = query(another_ctx.conn, :get_assignments_count, %{})
      assert count == 1
    end

    test "ignores closed goals", ctx do
      create_goal(ctx, upcoming_date())
      create_goal(ctx, past_date())
      create_goal(ctx, past_date()) |> close_goal()

      assert Repo.aggregate(Goal, :count, :id) == 3

      assert {200, %{count: count} = _res} = query(ctx.conn, :get_assignments_count, %{})
      assert count == 1
    end

    test "counts due project check-ins", ctx do
      another_ctx = register_and_log_in_account(ctx)

      project = create_project(ctx, upcoming_date(), %{
        reviewer_id: ctx.person.id,
        champion_id: another_ctx.person.id,
      })
      create_check_in(project)
      create_check_in(project)

      # Check-ins for another person
      another_project = create_project(another_ctx, upcoming_date(), %{
        reviewer_id: another_ctx.person.id,
        champion_id: ctx.person.id,
      })
      create_check_in(another_project)

      assert Repo.aggregate(CheckIn, :count, :id) == 3

      assert {200, %{count: count} = _res} = query(ctx.conn, :get_assignments_count, %{})
      assert count == 2

      assert {200, %{count: count} = _res} = query(another_ctx.conn, :get_assignments_count, %{})
      assert count == 1
    end

    test "counts due goal updates", ctx do
      another_ctx = register_and_log_in_account(ctx)

      goal = create_goal(ctx, upcoming_date(), %{
        reviewer_id: ctx.person.id,
        champion_id: another_ctx.person.id,
      })
      create_update(goal)
      create_update(goal)

      # Updates for another person
      another_goal = create_goal(another_ctx, upcoming_date(), %{
        reviewer_id: another_ctx.person.id,
        champion_id: ctx.person.id,
      })
      create_update(another_goal)

      assert Repo.aggregate(Update, :count, :id) == 3

      assert {200, %{count: count} = _res} = query(ctx.conn, :get_assignments_count, %{})
      assert count == 2

      assert {200, %{count: count} = _res} = query(another_ctx.conn, :get_assignments_count, %{})
      assert count == 1
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

  defp create_goal(ctx, date, attrs \\ %{}) do
    {:ok, goal} =
      goal_fixture(ctx.person, Map.merge(%{space_id: ctx.company.company_space_id}, attrs))
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
  end
end
