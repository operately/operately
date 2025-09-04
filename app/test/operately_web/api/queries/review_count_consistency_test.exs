defmodule OperatelyWeb.Api.Queries.ReviewCountConsistencyTest do
  use OperatelyWeb.TurboCase

  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures

  describe "review count consistency - Bug #3319" do
    setup :register_and_log_in_account

    test "count matches assignments list length", ctx do
      # This test verifies that GetAssignmentsCount returns the same count
      # as the length of assignments returned by GetAssignments.
      # This addresses the bug where the Review button showed a count 
      # but the page showed no items.
      
      # Create some assignments
      create_project(ctx, past_date())
      create_goal(ctx.person, ctx.company, past_date())
      
      # Create assignments where person is reviewer
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, upcoming_date(), %{
        reviewer_id: ctx.person.id,
        champion_id: another_person.id,
      })
      create_check_in(project)
      
      goal = create_goal(another_person, ctx.company, upcoming_date(), %{
        reviewer_id: ctx.person.id,
        champion_id: another_person.id,
      })
      create_update(another_person, goal)
      
      # Get count and assignments
      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count, %{})
      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})
      
      # They should match!
      assignment_types = Enum.map(assignments, &(&1.type))
      assert count == length(assignments), 
        "Count (#{count}) should match assignments length (#{length(assignments)}). Assignment types: #{inspect(assignment_types)}"
    end

    test "empty state - both return zero", ctx do
      # When there are no assignments, both should return 0
      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count, %{})
      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})
      
      assert count == 0
      assert length(assignments) == 0
    end

    test "mixed assignment types consistency", ctx do
      # Create a comprehensive mix of assignment types
      
      # Projects where person is champion (due)
      create_project(ctx, past_date(), %{name: "due_project"})
      
      # Goals where person is champion (due)
      create_goal(ctx.person, ctx.company, past_date(), %{name: "due_goal"})
      
      # Project check-ins where person is reviewer  
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      reviewer_project = create_project(ctx, upcoming_date(), %{
        reviewer_id: ctx.person.id,
        champion_id: another_person.id,
        name: "reviewer_project"
      })
      create_check_in(reviewer_project)
      create_check_in(reviewer_project) # Two check-ins
      
      # Goal updates where person is reviewer
      reviewer_goal = create_goal(another_person, ctx.company, upcoming_date(), %{
        reviewer_id: ctx.person.id,
        champion_id: another_person.id,
        name: "reviewer_goal"
      })
      create_update(another_person, reviewer_goal)
      
      # Items that should NOT be counted (future dates, other people's assignments)
      create_project(ctx, upcoming_date()) # Not due yet
      create_goal(ctx.person, ctx.company, upcoming_date()) # Not due yet
      
      other_person = person_fixture_with_account(%{company_id: ctx.company.id})
      create_project(ctx, past_date(), %{creator_id: other_person.id}) # Other person's project
      
      # Verify consistency
      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count, %{})
      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})
      
      # Should have: 1 project + 1 goal + 2 check-ins + 1 goal_update = 5 total
      expected_count = 5
      assignment_types = Enum.map(assignments, &(&1.type))
      
      assert count == expected_count, 
        "Expected #{expected_count} assignments, got count=#{count}. Assignment types: #{inspect(assignment_types)}"
      assert length(assignments) == expected_count,
        "Expected #{expected_count} assignments, got #{length(assignments)}. Assignment types: #{inspect(assignment_types)}"
      assert count == length(assignments),
        "Count (#{count}) should equal assignments length (#{length(assignments)})"
        
      # Verify we have the expected types
      type_counts = Enum.frequencies(assignment_types)
      assert type_counts["project"] == 1
      assert type_counts["goal"] == 1
      assert type_counts["check_in"] == 2
      assert type_counts["goal_update"] == 1
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
      |> Operately.Projects.Project.changeset(%{next_check_in_scheduled_at: date})
      |> Operately.Repo.update()

    project
  end

  defp create_goal(person, company, date, attrs \\ %{}) do
    {:ok, goal} =
      goal_fixture(person, Map.merge(%{space_id: company.company_space_id}, attrs))
      |> Operately.Goals.Goal.changeset(%{next_update_scheduled_at: date})
      |> Operately.Repo.update()

    goal
  end

  defp create_check_in(project) do
    project = Operately.Repo.preload(project, :champion)
    check_in_fixture(%{
      author_id: project.champion.id,
      project_id: project.id,
    })
  end

  defp create_update(creator, goal) do
    goal_update_fixture(creator, goal)
  end

  defp person_fixture_with_account(attrs \\ %{}) do
    Operately.PeopleFixtures.person_fixture_with_account(attrs)
  end
end