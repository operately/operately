defmodule OperatelyWeb.Api.Queries.GetAssignmentsCountV2Test do
  use OperatelyWeb.TurboCase

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Projects.Project

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_assignments_count_v2, %{})
    end
  end

  describe "get_assignments_count_v2" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.add_space_member(:another_person, :space)
      |> Factory.log_in_person(:person)
    end

    test "counts pending assignments from all sources", ctx do
      #  SHOULD COUNT (6 total)
      # 1. Pending project check-in
      create_project(ctx, past_date())

      # 2. Pending goal update
      create_goal(ctx.person, ctx.company, past_date())

      # 3. Pending task
      project_for_task = create_project(ctx, upcoming_date())
      create_task(project_for_task, ctx.person, %{status: "todo"})

      # 4. Pending milestone
      project_for_milestone = create_project(ctx, upcoming_date())
      create_milestone(project_for_milestone, %{status: :pending})

      # 5. Pending check-in acknowledgement
      reviewer_project = create_project(ctx, upcoming_date(), %{reviewer_id: ctx.person.id, creator_id: ctx.another_person.id})
      create_check_in(reviewer_project)

      # 6. Pending goal update acknowledgement
      reviewer_goal = create_goal(ctx.another_person, ctx.company, upcoming_date(), %{reviewer_id: ctx.person.id})
      create_update(ctx.another_person, reviewer_goal)

      # --- SHOULD NOT COUNT ---
      # Project check-in in the future
      create_project(ctx, upcoming_date())
      # Closed project
      create_project(ctx, past_date()) |> close_project()
      # Goal update in the future
      create_goal(ctx.person, ctx.company, upcoming_date())
      # Completed task
      create_task(project_for_task, ctx.person, %{status: "done"})
      # Completed milestone
      create_milestone(project_for_milestone, %{status: :done})
      # Assignment for another person
      create_goal(ctx.another_person, ctx.company, past_date())

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 6
    end

    test "returns 0 when there are no pending assignments", ctx do
      create_project(ctx, upcoming_date())
      create_goal(ctx.person, ctx.company, upcoming_date())

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end
  end

  # --- Helpers ---

  defp past_date, do: DateTime.add(DateTime.utc_now(), -3, :day)
  defp upcoming_date, do: DateTime.add(DateTime.utc_now(), 3, :day)

  defp create_project(ctx, date, attrs \\ %{}) do
    {:ok, project} =
      Operately.ProjectsFixtures.project_fixture(
        Map.merge(
          %{
            creator_id: ctx.person.id,
            company_id: ctx.company.id,
            group_id: ctx.company.company_space_id
          },
          attrs
        )
      )
      |> Project.changeset(%{next_check_in_scheduled_at: date})
      |> Repo.update()

    project
  end

  defp close_project(project) do
    {:ok, project} =
      Project.changeset(project, %{
        status: "closed",
        closed_at: DateTime.utc_now(),
        closed_by_id: project.creator_id
      })
      |> Repo.update()

    project
  end

  defp create_goal(person, company, date, attrs \\ %{}) do
    {:ok, goal} =
      Operately.GoalsFixtures.goal_fixture(person, Map.merge(%{space_id: company.company_space_id}, attrs))
      |> Goal.changeset(%{next_update_scheduled_at: date})
      |> Repo.update()

    goal
  end

  defp create_check_in(project) do
    project = Repo.preload(project, :champion)

    Operately.ProjectsFixtures.check_in_fixture(%{
      author_id: project.champion.id,
      project_id: project.id
    })
  end

  defp create_update(creator, goal) do
    Operately.GoalsFixtures.goal_update_fixture(creator, goal)
  end

  defp create_task(project, person, attrs) do
    task =
      Map.merge(%{project_id: project.id, creator_id: person.id}, attrs)
      |> Operately.TasksFixtures.task_fixture()

    Operately.TasksFixtures.assignee_fixture(%{
      task_id: task.id,
      person_id: person.id
    })

    Repo.preload(task, :project)
  end

  defp create_milestone(project, attrs) do
    Operately.ProjectsFixtures.milestone_fixture(Map.merge(%{project_id: project.id}, attrs))
  end
end
