defmodule OperatelyEmail.Assignments.LoaderTest do
  use Operately.DataCase

  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  
  alias Operately.Projects.Project
  alias Operately.Goals.Goal

  setup do
    company = company_fixture()
    champion = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(champion, %{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: champion.id, group_id: group.id})
    goal = goal_fixture(champion, %{company_id: company.id, space_id: group.id})

    {:ok, project} = Operately.Repo.update(Project.changeset(project, %{
      next_update_scheduled_at: days_from_now(10)
    }))

    {:ok, %{company: company, champion: champion, project: project, goal: goal}}
  end

  describe "goal check-in" do
    test "it sends if goal check is due", ctx do
      {:ok, _} = Operately.Repo.update(Goal.changeset(ctx.goal, %{
        next_update_scheduled_at: days_from_now(0)
      }))

      assignments = OperatelyEmail.Assignments.Loader.load(ctx.champion)

      assert Enum.member?(assignment_types(assignments), :goal_check_in)
    end

    test "it doesn't send if goal check is not due", ctx do
      {:ok, _} = Operately.Repo.update(Goal.changeset(ctx.goal, %{
        next_update_scheduled_at: days_from_now(10)
      }))

      assignments = OperatelyEmail.Assignments.Loader.load(ctx.champion)

      refute Enum.member?(assignment_types(assignments), :goal_check_in)
    end
  end

  describe "project milestones" do
    setup ctx do
      milestone(ctx, "Buy domain", :done, days_ago(10))
      milestone(ctx, "Publish book", :pending, days_ago(2))
      milestone(ctx, "Update website", :pending, days_ago(1))
      milestone(ctx, "Gain 1000 followers", :pending, days_from_now(10))

      assignments = OperatelyEmail.Assignments.Loader.load(ctx.champion)

      {:ok, %{names: assignment_names(assignments)}}
    end

    test "it sends pending overdue milestones", ctx do
      assert Enum.member?(ctx.names, "Publish book")
    end

    test "it sends pending milestones due today", ctx do
      assert Enum.member?(ctx.names, "Update website")
    end

    test "it doesn't send already completed milestones", ctx do
      refute Enum.member?(ctx.names, "Buy domain")
    end

    test "it doesn't send milestones due in the future", ctx do
      refute Enum.member?(ctx.names, "Buy domain")
    end
  end

  #
  # Utility functions
  #

  defp milestone(ctx, title, status, deadline) do
    milestone_fixture(ctx.champion, %{
      title: title,
      project_id: ctx.project.id,
      deadline_at: deadline,
      status: status
    })
  end

  defp assignment_names(assignment_groups) do
    Enum.flat_map(assignment_groups, &(&1.assignments)) |> Enum.map(&(&1.name))
  end

  defp assignment_types(assignment_groups) do
    Enum.flat_map(assignment_groups, &(&1.assignments)) |> Enum.map(&(&1.type))
  end

  defp days_ago(days) do
    DateTime.add(DateTime.utc_now(), -days, :day)
  end

  defp days_from_now(days) do
    DateTime.add(DateTime.utc_now(), days, :day)
  end
end
