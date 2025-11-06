defmodule OperatelyWeb.Api.Queries.GetAssignmentsTest do
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
      assert {401, _} = query(ctx.conn, :get_assignments, %{})
    end
  end

  describe "get_assignments" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.log_in_person(:person)
    end

    test "gets pending project check-ins", ctx do
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

    test "ignores pending check-ins of closed projects", ctx do
      create_project(ctx, upcoming_date())
      create_project(ctx, past_date()) |> close_project()
      due_project = create_project(ctx, past_date(), %{name: "single project"})

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(Project, :count, :id) == 3
      assert length(assignments) == 1

      [p] = assignments

      assert p.resource_id == Paths.project_id(due_project)
      assert p.name == "single project - Check-in"
      assert p.due
      assert p.type == "check_in"
      assert p.role == "owner"
    end

    test "get pending goal check-ins", ctx do
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

    test "ignores pending check-ins of closed goals", ctx do
      create_goal(ctx.person, ctx.company, upcoming_date())
      create_goal(ctx.person, ctx.company, past_date()) |> close_goal()
      due_goal = create_goal(ctx.person, ctx.company, past_date(), %{name: "single goal"})

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(Goal, :count, :id) == 3
      assert length(assignments) == 1

      [g] = assignments

      assert g.resource_id == Paths.goal_id(due_goal)
      assert g.name == "single goal - Goal Update"
      assert g.due
      assert g.type == "goal_update"
      assert g.role == "owner"
    end

    test "get pending project check-in acknowledgements", ctx do
      another_person = person_fixture_with_account(%{full_name: "champion", company_id: ctx.company.id})
      project =
        create_project(ctx, upcoming_date(), %{
          creator_id: another_person.id,
          reviewer_id: ctx.person.id,
        })

      check_in = create_check_in(project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

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

    test "ignores pending acknowledgements of own project check-ins", ctx do
      project = create_project(ctx, upcoming_date())
      create_check_in(project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert length(assignments) == 0
    end

    test "get pending goal check-in acknowledgements", ctx do
      another_person = person_fixture_with_account(%{full_name: "champion", company_id: ctx.company.id})
      goal =
        create_goal(another_person, ctx.company, upcoming_date(), %{
          reviewer_id: ctx.person.id,
        })

      update = create_update(another_person, goal)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

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

    test "ignores pending acknowledgements of own goal check-ins", ctx do
      goal = create_goal(ctx.person, ctx.company, upcoming_date())
      create_update(ctx.person, goal)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert length(assignments) == 0
    end

    test "get pending tasks", ctx do
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

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      assert Repo.aggregate(ProjectTask, :count, :id) == 4
      assert length(assignments) == 2

      task_assignments = Enum.filter(assignments, &(&1.type == "project_task"))
      assert length(task_assignments) == 2

      [t1, t2] = Enum.sort_by(task_assignments, & &1.name)

      assert t1.resource_id == Paths.task_id(task1)
      assert t1.name == "Task 1"
      assert t1.type == "project_task"
      assert t1.role == "owner"
      assert t1.action_label == "Task 1"
      assert t1.task_status == "todo"
      assert t1.origin
      assert t1.origin.type == "project"
      assert t1.origin.name == "My Project"

      assert t2.resource_id == Paths.task_id(task2)
      assert t2.name == "Task 2"
      assert t2.task_status == "in_progress"
    end

    test "ignores tasks from deleted projects", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "Project"})

      create_task(project, ctx.person, %{
        name: "Task",
        status: "todo",
        due_date: ContextualDate.create_day_date(past_date_as_date())
      })

      Repo.soft_delete(project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      task_assignments = Enum.filter(assignments, &(&1.type == "project_task"))
      assert length(task_assignments) == 0
    end

    test "ignores tasks from closed projects", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "Project"})

      create_task(project, ctx.person, %{
        name: "Task",
        status: "todo",
        due_date: ContextualDate.create_day_date(past_date_as_date())
      })

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 1

      Map.put(ctx, :project, project)
      |> Factory.close_project(:project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 0
    end

    test "get pending milestones", ctx do
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

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      milestone_assignments = Enum.filter(assignments, &(&1.type == "milestone"))
      assert length(milestone_assignments) == 2

      [m1, m2] = Enum.sort_by(milestone_assignments, & &1.name)

      assert m1.resource_id == Paths.milestone_id(milestone1)
      assert m1.name == "Milestone 1"
      assert m1.type == "milestone"
      assert m1.role == "owner"
      assert m1.action_label == "Milestone 1"
      assert m1.origin
      assert m1.origin.type == "project"
      assert m1.origin.name == "My Project"

      assert m2.resource_id == Paths.milestone_id(milestone2)
      assert m2.name == "Milestone 2"
    end

    test "ignores milestones from deleted projects", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "Project"})

      create_milestone(project, %{
        title: "Milestone",
        status: :pending
      })

      # Soft delete the project
      Repo.soft_delete(project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      milestone_assignments = Enum.filter(assignments, &(&1.type == "milestone"))
      assert length(milestone_assignments) == 0
    end

    test "ignores milestones from closed projects", ctx do
      project = create_project(ctx, upcoming_date(), %{name: "Project"})

      create_milestone(project, %{
        title: "Milestone",
        status: :pending
      })

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 1

      Map.put(ctx, :project, project)
      |> Factory.close_project(:project)

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})
      assert length(assignments) == 0
    end

    test "get pending milestones for project champion only", ctx do
      another_person = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, upcoming_date(), %{
        creator_id: another_person.id,
        name: "Other Project"
      })

      create_milestone(project, %{
        title: "Milestone",
        status: :pending
      })

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

      milestone_assignments = Enum.filter(assignments, &(&1.type == "milestone"))
      assert length(milestone_assignments) == 0
    end

    test "ignores deleted milestones", ctx do
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

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

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

      assert {200, %{assignments: assignments} = _res} = query(ctx.conn, :get_assignments, %{})

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

  describe "reviewer change filtering" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.add_company_member(:reviewer)
      |> Factory.add_company_member(:new_reviewer)
      |> Factory.add_company_member(:champion)
      |> Factory.log_in_person(:reviewer)
    end

    test "filters project check-ins created before reviewer change", ctx do
      # Create project with old reviewer
      project = create_project(ctx, upcoming_date(), %{
        creator_id: ctx.champion.id,
        champion_id: ctx.champion.id,
        reviewer_id: ctx.reviewer.id,
      })
      create_check_in(project)

      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})

      assert length(assignments) == 1

      # Change reviewer to new reviewer
      assert {200, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(project),
        reviewer_id: Paths.person_id(ctx.new_reviewer)
      })

      ctx = Factory.log_in_person(ctx, :new_reviewer)
      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})

      assert length(assignments) == 0

      # Small delay to ensure the new check-in has a later timestamp than the activity
      Process.sleep(1000)
      new_check_in = create_check_in(project)

      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})

      assert length(assignments) == 1

      [assignment] = assignments
      assert assignment.resource_id == Paths.project_check_in_id(new_check_in)
    end

    test "includes all project check-ins when no reviewer change occurred", ctx do
      project = create_project(ctx, upcoming_date(), %{
        creator_id: ctx.champion.id,
        champion_id: ctx.champion.id,
        reviewer_id: ctx.reviewer.id,
      })

      check_in1 = create_check_in(project, ctx.champion)
      check_in2 = create_check_in(project, ctx.champion)

      # Reviewer should see both check-ins (no reviewer change activity exists)
      ctx = Factory.log_in_person(ctx, :reviewer)
      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})

      check_in_assignments = Enum.filter(assignments, &(&1.type == "check_in" && &1.role == "reviewer"))
      assert length(check_in_assignments) == 2

      check_in_ids = Enum.map(check_in_assignments, & &1.resource_id)
      assert Paths.project_check_in_id(check_in1) in check_in_ids
      assert Paths.project_check_in_id(check_in2) in check_in_ids
    end

    test "uses latest reviewer change when multiple changes occur", ctx do
      project = create_project(ctx, upcoming_date(), %{
        creator_id: ctx.champion.id,
        champion_id: ctx.champion.id,
        reviewer_id: ctx.reviewer.id,
      })

      create_check_in(project, ctx.champion)

      # First reviewer change
      assert {200, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(project),
        reviewer_id: Paths.person_id(ctx.person)
      })

      # Small delay to ensure the new check-in has a later timestamp than the activity
      Process.sleep(1000)

      create_check_in(project, ctx.champion)

      # Second reviewer change to new reviewer
      assert {200, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(project),
        reviewer_id: Paths.person_id(ctx.new_reviewer)
      })

      # Small delay to ensure the new check-in has a later timestamp than the activity
      Process.sleep(1000)

      # Champion creates check-in with new reviewer
      new_check_in = create_check_in(project, ctx.champion)

      # New reviewer should only see check-ins after the latest reviewer change
      ctx = Factory.log_in_person(ctx, :new_reviewer)
      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})

      check_in_assignments = Enum.filter(assignments, &(&1.type == "check_in" && &1.role == "reviewer"))
      assert length(check_in_assignments) == 1

      [assignment] = check_in_assignments
      assert assignment.resource_id == Paths.project_check_in_id(new_check_in)
    end

    test "filters goal updates created before reviewer change", ctx do
      # Create goal with old reviewer
      goal = create_goal(ctx.champion, ctx.company, upcoming_date(), %{
        reviewer_id: ctx.reviewer.id,
      })

      create_update(ctx.champion, goal)

      # Change reviewer to new reviewer (creates goal_reviewer_updating activity)
      assert {200, _} = mutation(ctx.conn, [:goals, :update_reviewer], %{
        goal_id: Paths.goal_id(goal),
        reviewer_id: Paths.person_id(ctx.new_reviewer)
      })

      # Small delay to ensure the new update has a later timestamp than the activity
      Process.sleep(1000)

      # Champion creates another update after reviewer change
      new_update = create_update(ctx.champion, goal)

      # New reviewer should only see the update created after they became reviewer
      ctx = Factory.log_in_person(ctx, :new_reviewer)
      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})

      update_assignments = Enum.filter(assignments, &(&1.type == "goal_update" && &1.role == "reviewer"))
      assert length(update_assignments) == 1

      [assignment] = update_assignments
      assert assignment.resource_id == Paths.goal_update_id(new_update)
    end

    test "includes all goal updates when no reviewer change occurred", ctx do
      goal = create_goal(ctx.champion, ctx.company, upcoming_date(), %{
        reviewer_id: ctx.reviewer.id,
      })

      update1 = create_update(ctx.champion, goal)
      update2 = create_update(ctx.champion, goal)

      # Reviewer should see both updates (no reviewer change activity exists)
      ctx = Factory.log_in_person(ctx, :reviewer)
      assert {200, %{assignments: assignments}} = query(ctx.conn, :get_assignments, %{})

      update_assignments = Enum.filter(assignments, &(&1.type == "goal_update" && &1.role == "reviewer"))
      assert length(update_assignments) == 2

      update_ids = Enum.map(update_assignments, & &1.resource_id)
      assert Paths.goal_update_id(update1) in update_ids
      assert Paths.goal_update_id(update2) in update_ids
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

  defp create_check_in(project, author) do
    Operately.ProjectsFixtures.check_in_fixture(%{
      author_id: author.id,
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
