defmodule OperatelyWeb.Api.Queries.GetAssignmentsV2Test do
  use OperatelyWeb.TurboCase

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Tasks.Task, as: ProjectTask
  alias Operately.ContextualDates.ContextualDate

  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_assignments_v2, %{})
    end
  end

  describe "get_assignments_v2" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.log_in_person(:person)
    end

    test "get_pending_project_check_ins", ctx do
      today_project = create_project(ctx, DateTime.utc_now(), %{name: "today"})
      due_project = create_project(ctx, past_date(), %{name: "3 days ago"})
      create_project(ctx, upcoming_date())

      # Projects for another person
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      create_project(ctx, past_date(), %{creator_id: another_person.id})
      create_project(ctx, upcoming_date(), %{creator_id: another_person.id})

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert Repo.aggregate(Project, :count, :id) == 5
      assert length(assignments) == 2

      p1 = Enum.find(assignments, &(&1.resource_id == Paths.project_id(today_project)))
      p2 = Enum.find(assignments, &(&1.resource_id == Paths.project_id(due_project)))

      assert p1.name == "today - Check-in"
      assert p1.due
      assert p1.type == "check_in"
      assert p1.role == "owner"
      assert p1.action_label == "Submit weekly check-in"
      assert p1.path
      assert p1.origin
      assert p1.origin.type == "project"
      assert p1.origin.name == "today"

      assert p2.name == "3 days ago - Check-in"
      assert p2.due
      assert p2.type == "check_in"
      assert p2.role == "owner"
    end

    test "get_pending_project_check_ins ignores closed projects", ctx do
      create_project(ctx, upcoming_date())
      create_project(ctx, past_date()) |> close_project()
      due_project = create_project(ctx, past_date(), %{name: "single project"})

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert Repo.aggregate(Project, :count, :id) == 3
      assert length(assignments) == 1

      [p] = assignments

      assert p.resource_id == Paths.project_id(due_project)
      assert p.name == "single project - Check-in"
      assert p.due
      assert p.type == "check_in"
      assert p.role == "owner"
    end

    test "get_pending_goal_updates", ctx do
      today_goal = create_goal(ctx.person, ctx.company, DateTime.utc_now(), %{name: "today"})
      due_goal = create_goal(ctx.person, ctx.company, past_date(), %{name: "3 days ago"})
      create_goal(ctx.person, ctx.company, upcoming_date())

      # Goals for another person
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      create_goal(another_person, ctx.company, past_date())
      create_goal(another_person, ctx.company, upcoming_date())

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert Repo.aggregate(Goal, :count, :id) == 5
      assert length(assignments) == 2

      g1 = Enum.find(assignments, &(&1.resource_id == Paths.goal_id(today_goal)))
      g2 = Enum.find(assignments, &(&1.resource_id == Paths.goal_id(due_goal)))

      assert g1.name == "today - Goal Update"
      assert g1.due
      assert g1.type == "goal_update"
      assert g1.role == "owner"
      assert g1.action_label == "Submit goal progress update"
      assert g1.origin
      assert g1.origin.type == "goal"
      assert g1.origin.name == "today"

      assert g2.name == "3 days ago - Goal Update"
      assert g2.due
      assert g2.type == "goal_update"
      assert g2.role == "owner"
    end

    test "get_pending_goal_updates ignores closed goals", ctx do
      create_goal(ctx.person, ctx.company, upcoming_date())
      create_goal(ctx.person, ctx.company, past_date()) |> close_goal()
      due_goal = create_goal(ctx.person, ctx.company, past_date(), %{name: "single goal"})

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert Repo.aggregate(Goal, :count, :id) == 3
      assert length(assignments) == 1

      [g] = assignments

      assert g.resource_id == Paths.goal_id(due_goal)
      assert g.name == "single goal - Goal Update"
      assert g.due
      assert g.type == "goal_update"
      assert g.role == "owner"
    end

    test "get_pending_project_check_in_acknowledgements", ctx do
      another_person = person_fixture_with_account(%{full_name: "champion", company_id: ctx.company.id})
      project =
        create_project(ctx, upcoming_date(), %{
          creator_id: another_person.id,
          reviewer_id: ctx.person.id,
        })

      check_in = create_check_in(project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert length(assignments) == 1

      [c] = assignments

      assert c.resource_id == Paths.project_check_in_id(check_in)
      assert c.type == "check_in"
      assert c.role == "reviewer"
      assert c.action_label == "Review weekly check-in"
      assert c.author_id == Paths.person_id(another_person)
      assert c.author_name == "champion"
      assert c.origin
      assert c.origin.type == "project"
    end

    test "get_pending_project_check_in_acknowledgements ignores own check-ins", ctx do
      project = create_project(ctx, upcoming_date())
      create_check_in(project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert length(assignments) == 0
    end

    test "get_pending_goal_update_acknowledgements", ctx do
      another_person = person_fixture_with_account(%{full_name: "champion", company_id: ctx.company.id})
      goal =
        create_goal(another_person, ctx.company, upcoming_date(), %{
          reviewer_id: ctx.person.id,
        })

      update = create_update(another_person, goal)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert length(assignments) == 1

      [u] = assignments

      assert u.resource_id == Paths.goal_update_id(update)
      assert u.type == "goal_update"
      assert u.role == "reviewer"
      assert u.action_label == "Review goal progress update"
      assert u.author_id == Paths.person_id(another_person)
      assert u.author_name == "champion"
      assert u.origin
      assert u.origin.type == "goal"
    end

    test "get_pending_goal_update_acknowledgements ignores own updates", ctx do
      goal = create_goal(ctx.person, ctx.company, upcoming_date())
      create_update(ctx.person, goal)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert length(assignments) == 0
    end

    test "get_pending_tasks", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "My Project"})

      task1 = create_task(project, ctx.person, %{
        name: "Task 1",
        status: "todo",
        due_date: ContextualDate.create_day_date(Date.utc_today())
      })

      task2 = create_task(project, ctx.person, %{
        name: "Task 2",
        status: "in_progress",
        due_date: ContextualDate.create_day_date(past_date_as_date())
      })

      # Task for another person - should not appear
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      create_task(project, another_person, %{
        name: "Other Task",
        status: "todo",
        due_date: ContextualDate.create_day_date(past_date_as_date())
      })

      # Completed task - should not appear
      create_task(project, ctx.person, %{
        name: "Completed Task",
        status: "completed",
        due_date: ContextualDate.create_day_date(past_date_as_date())
      })

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      assert Repo.aggregate(ProjectTask, :count, :id) == 4
      assert length(assignments) == 2

      task_assignments = Enum.filter(assignments, &(&1.type == "project_task"))
      assert length(task_assignments) == 2

      [t1, t2] = Enum.sort_by(task_assignments, & &1.name)

      assert t1.resource_id == Paths.task_id(task1)
      assert t1.name == "Task 1"
      assert t1.type == "project_task"
      assert t1.role == "owner"
      assert t1.action_label == "Complete Task 1"
      assert t1.task_status == "todo"
      assert t1.origin
      assert t1.origin.type == "project"
      assert t1.origin.name == "My Project"

      assert t2.resource_id == Paths.task_id(task2)
      assert t2.name == "Task 2"
      assert t2.task_status == "in_progress"
    end

    test "get_pending_tasks ignores tasks from deleted projects", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "Project"})

      create_task(project, ctx.person, %{
        name: "Task",
        status: "todo",
        due_date: ContextualDate.create_day_date(past_date_as_date())
      })

      Repo.soft_delete(project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      task_assignments = Enum.filter(assignments, &(&1.type == "project_task"))
      assert length(task_assignments) == 0
    end

    test "get_pending_milestones", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "My Project"})

      milestone1 = create_milestone(project, %{
        title: "Milestone 1",
        status: :pending,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
          contextual_end_date: ContextualDate.create_day_date(Date.add(Date.utc_today(), 7))
        }
      })

      milestone2 = create_milestone(project, %{
        title: "Milestone 2",
        status: :pending,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
          contextual_end_date: ContextualDate.create_day_date(Date.add(Date.utc_today(), 14))
        }
      })

      # Completed milestone - should not appear
      create_milestone(project, %{
        title: "Completed Milestone",
        status: :done
      })

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      milestone_assignments = Enum.filter(assignments, &(&1.type == "milestone"))
      assert length(milestone_assignments) == 2

      [m1, m2] = Enum.sort_by(milestone_assignments, & &1.name)

      assert m1.resource_id == Paths.milestone_id(milestone1)
      assert m1.name == "Milestone 1"
      assert m1.type == "milestone"
      assert m1.role == "owner"
      assert m1.action_label == "Complete Milestone 1"
      assert m1.origin
      assert m1.origin.type == "project"
      assert m1.origin.name == "My Project"

      assert m2.resource_id == Paths.milestone_id(milestone2)
      assert m2.name == "Milestone 2"
    end

    test "get_pending_milestones ignores milestones from deleted projects", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "Project"})

      create_milestone(project, %{
        title: "Milestone",
        status: :pending
      })

      # Soft delete the project
      Repo.soft_delete(project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      milestone_assignments = Enum.filter(assignments, &(&1.type == "milestone"))
      assert length(milestone_assignments) == 0
    end

    test "get_pending_milestones for project champion only", ctx do
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, upcoming_date(), %{
        creator_id: another_person.id,
        name: "Other Project"
      })

      create_milestone(project, %{
        title: "Milestone",
        status: :pending
      })

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      milestone_assignments = Enum.filter(assignments, &(&1.type == "milestone"))
      assert length(milestone_assignments) == 0
    end

    test "get_pending_milestones ignores deleted milestones", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "Project"})

      create_milestone(project, %{
        title: "Active Milestone",
        status: :pending
      })

      deleted_milestone = create_milestone(project, %{
        title: "Deleted Milestone",
        status: :pending
      })

      Repo.soft_delete(deleted_milestone)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      milestone_assignments = Enum.filter(assignments, &(&1.type == "milestone"))
      assert length(milestone_assignments) == 1

      [m] = milestone_assignments
      assert m.name == "Active Milestone"
    end

    test "comprehensive test with all assignment types", ctx do
      project = create_project(ctx, past_date(), %{name: "Project"})

      create_task(project, ctx.person, %{
        name: "Task",
        status: "todo"
      })

      create_milestone(project, %{
        title: "Milestone",
        status: :pending
      })

      create_goal(ctx.person, ctx.company, past_date(), %{name: "Goal"})

      # Create another person's check-in to review
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      review_project = create_project(ctx, upcoming_date(), %{
        creator_id: another_person.id,
        reviewer_id: ctx.person.id,
        name: "Review Project"
      })
      create_check_in(review_project)

      # Create another person's goal update to review
      review_goal = create_goal(another_person, ctx.company, upcoming_date(), %{
        reviewer_id: ctx.person.id,
        name: "Review Goal"
      })
      create_update(another_person, review_goal)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments_v2, %{})

      # Should have: 2 check-ins (1 to submit, 1 to review), 2 goal updates (1 to submit, 1 to review), 1 task, 1 milestone
      assert length(assignments) == 6

      owner_check_ins = Enum.filter(assignments, &(&1.type == "check_in" and &1.role == "owner"))
      reviewer_check_ins = Enum.filter(assignments, &(&1.type == "check_in" and &1.role == "reviewer"))
      owner_goal_updates = Enum.filter(assignments, &(&1.type == "goal_update" and &1.role == "owner"))
      reviewer_goal_updates = Enum.filter(assignments, &(&1.type == "goal_update" and &1.role == "reviewer"))
      tasks = Enum.filter(assignments, &(&1.type == "project_task"))
      milestones = Enum.filter(assignments, &(&1.type == "milestone"))

      assert length(owner_check_ins) == 1
      assert length(reviewer_check_ins) == 1
      assert length(owner_goal_updates) == 1
      assert length(reviewer_goal_updates) == 1
      assert length(tasks) == 1
      assert length(milestones) == 1
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

  defp past_date_as_date do
    Date.utc_today()
    |> Date.add(-3)
  end

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

  defp close_goal(goal) do
    {:ok, goal} =
      Goal.changeset(goal, %{
        closed_at: DateTime.utc_now(),
        closed_by_id: goal.creator_id
      })
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
