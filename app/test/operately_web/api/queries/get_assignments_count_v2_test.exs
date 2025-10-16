defmodule OperatelyWeb.Api.Queries.GetAssignmentsCountV2Test do
  use OperatelyWeb.TurboCase

  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{Project, CheckIn}
  alias Operately.ContextualDates.ContextualDate

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_assignments_count_v2, %{})
    end
  end

  describe "get_assignments_count_v2" do
    setup ctx, do: set_up(ctx)

    test "returns 0 when there are no pending assignments", ctx do
      create_project(ctx, gen_future_date(3))
      create_goal(ctx.person, ctx.company, gen_future_date(3))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end

    test "counts pending assignments from all sources", ctx do
      #  SHOULD COUNT (6 total)
      # 1. Pending project check-in
      create_project(ctx, gen_past_date(3))

      # 2. Pending goal update
      create_goal(ctx.person, ctx.company, gen_past_date(3))

      # 3. Pending task
      project_for_task = create_project(ctx, gen_future_date(3))

      create_task(project_for_task, ctx.person, %{
        status: "todo",
        due_date: ContextualDate.create_day_date(Date.utc_today())
      })

      # 4. Pending milestone
      project_for_milestone = create_project(ctx, gen_future_date(3))

      create_milestone(project_for_milestone, %{
        status: :pending,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
          contextual_end_date: ContextualDate.create_day_date(Date.utc_today())
        }
      })

      # 5. Pending check-in acknowledgement
      reviewer_project = create_project(ctx, gen_future_date(3), %{reviewer_id: ctx.person.id, creator_id: ctx.another_person.id})
      create_check_in(reviewer_project)

      # 6. Pending goal update acknowledgement
      reviewer_goal = create_goal(ctx.another_person, ctx.company, gen_future_date(3), %{reviewer_id: ctx.person.id})
      create_update(ctx.another_person, reviewer_goal)

      # --- SHOULD NOT COUNT ---
      # Project check-in in the future
      create_project(ctx, gen_future_date(3))
      # Closed project
      create_project(ctx, gen_past_date(3)) |> close_project()
      # Goal update in the future
      create_goal(ctx.person, ctx.company, gen_future_date(3))
      # Completed task
      create_task(project_for_task, ctx.person, %{status: "done"})
      # Completed milestone
      create_milestone(project_for_milestone, %{status: :done})
      # Upcoming task
      create_task(project_for_task, ctx.person, %{
        status: "todo",
        due_date: ContextualDate.create_day_date(Date.add(Date.utc_today(), 5))
      })

      # Upcoming milestone
      create_milestone(project_for_milestone, %{
        status: :pending,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(Date.utc_today()),
          contextual_end_date: ContextualDate.create_day_date(Date.add(Date.utc_today(), 5))
        }
      })

      # Assignment for another person
      create_goal(ctx.another_person, ctx.company, gen_past_date(3))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 6
    end
  end

  describe "get_assignments_count_v2 tasks" do
    setup ctx, do: set_up(ctx)

    test "includes tasks past due", ctx do
      project_for_task = create_project(ctx, gen_future_date(3))

      create_task(project_for_task, ctx.person, %{
        status: "todo",
        due_date: ContextualDate.create_day_date(gen_past_date(3))
      })

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 1
    end

    test "includes tasks due to today and tomorrow", ctx do
      project_for_task = create_project(ctx, gen_future_date(3))

      create_task(project_for_task, ctx.person, %{
        status: "todo",
        due_date: ContextualDate.create_day_date(Date.utc_today())
      })

      create_task(project_for_task, ctx.person, %{
        status: "todo",
        due_date: ContextualDate.create_day_date(tomorrow_date())
      })

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 2
    end

    test "doesn't include tasks due to more than tomorrow", ctx do
      project_for_task = create_project(ctx, gen_future_date(3))

      create_task(project_for_task, ctx.person, %{
        status: "todo",
        due_date: ContextualDate.create_day_date(gen_future_date(2))
      })

      create_task(project_for_task, ctx.person, %{
        status: "todo",
        due_date: ContextualDate.create_day_date(gen_future_date(3))
      })

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end

    test "includes tasks with pending, todo and in_progress status", ctx do
      project_for_task = create_project(ctx, gen_future_date(3))

      create_task(project_for_task, ctx.person, %{
        status: "pending",
        due_date: ContextualDate.create_day_date(Date.utc_today())
      })

      create_task(project_for_task, ctx.person, %{
        status: "todo",
        due_date: ContextualDate.create_day_date(Date.utc_today())
      })

      create_task(project_for_task, ctx.person, %{
        status: "in_progress",
        due_date: ContextualDate.create_day_date(Date.utc_today())
      })

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 3
    end

    test "doesn't include tasks with done and canceled status", ctx do
      project_for_task = create_project(ctx, gen_future_date(3))

      create_task(project_for_task, ctx.person, %{
        status: "done",
        due_date: ContextualDate.create_day_date(Date.utc_today())
      })

      create_task(project_for_task, ctx.person, %{
        status: "canceled",
        due_date: ContextualDate.create_day_date(Date.utc_today())
      })

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end
  end

  describe "get_assignments_count_v2 project check-ins" do
    setup ctx, do: set_up(ctx)

    test "includes projects with overdue check-ins", ctx do
      create_project(ctx, gen_past_date(3))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 1
    end

    test "includes projects with check-ins due to today and tomorrow", ctx do
      create_project(ctx, gen_future_date(0))
      create_project(ctx, gen_past_date(1))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 2
    end

    test "doesn't include check-ins scheduled in the future", ctx do
      create_project(ctx, gen_future_date(3))
      create_project(ctx, gen_future_date(2))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end

    test "doesn't include closed projects", ctx do
      create_project(ctx, gen_past_date(3))
      |> close_project()

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end
  end

  describe "get_assignments_count_v2 project check-in acknowledgements" do
    setup ctx, do: set_up(ctx)

    test "includes unacknowledged check-ins for reviewers", ctx do
      reviewer_project =
        create_project(ctx, gen_future_date(3), %{
          creator_id: ctx.another_person.id,
          champion_id: ctx.another_person.id,
          reviewer_id: ctx.person.id
        })

      create_check_in(reviewer_project)

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 1
    end

    test "doesn't include acknowledged check-ins", ctx do
      reviewer_project =
        create_project(ctx, gen_future_date(3), %{
          creator_id: ctx.another_person.id,
          champion_id: ctx.another_person.id,
          reviewer_id: ctx.person.id
        })

      reviewer_project
      |> create_check_in()
      |> acknowledge_check_in(ctx.person)

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end

    test "doesn't include check-ins where the reviewer is the author", ctx do
      create_project(ctx, gen_future_date(3), %{reviewer_id: ctx.person.id})
      |> create_check_in()

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end
  end

  describe "get_assignments_count_v2 goal updates" do
    setup ctx, do: set_up(ctx)

    test "includes goals with overdue updates", ctx do
      create_goal(ctx.person, ctx.company, gen_past_date(3))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 1
    end

    test "includes goals with updates due to today and tomorrow", ctx do
      create_goal(ctx.person, ctx.company, gen_past_date(0))
      create_goal(ctx.person, ctx.company, gen_past_date(1))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 2
    end

    test "doesn't include goals with updates scheduled in the future", ctx do
      create_goal(ctx.person, ctx.company, gen_future_date(3))
      create_goal(ctx.person, ctx.company, gen_future_date(2))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end

    test "doesn't include goals owned by someone else", ctx do
      create_goal(ctx.another_person, ctx.company, gen_past_date(3))

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end
  end

  describe "get_assignments_count_v2 goal update acknowledgements" do
    setup ctx, do: set_up(ctx)

    test "includes unacknowledged goal updates for reviewers", ctx do
      goal =
        create_goal(ctx.another_person, ctx.company, gen_future_date(3), %{
          reviewer_id: ctx.person.id,
          champion_id: ctx.another_person.id
        })

      create_update(ctx.another_person, goal)

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 1
    end

    test "doesn't include acknowledged goal updates", ctx do
      goal =
        create_goal(ctx.another_person, ctx.company, gen_future_date(3), %{
          reviewer_id: ctx.person.id,
          champion_id: ctx.another_person.id
        })

      goal_update = create_update(ctx.another_person, goal)
      acknowledge_goal_update(goal_update, ctx.person)

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end

    test "doesn't include goal updates authored by the reviewer", ctx do
      goal = create_goal(ctx.person, ctx.company, gen_future_date(3))
      create_update(ctx.person, goal)

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end
  end

  describe "get_assignments_count_v2 milestones" do
    setup ctx, do: set_up(ctx)

    test "includes milestones due to today and tomorrow", ctx do
      project = create_project(ctx, gen_future_date(3))

      create_milestone(project, %{
        status: :pending,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(gen_past_date(3)),
          contextual_end_date: ContextualDate.create_day_date(Date.utc_today())
        }
      })

      create_milestone(project, %{
        status: :pending,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(gen_past_date(3)),
          contextual_end_date: ContextualDate.create_day_date(gen_future_date(1))
        }
      })

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 2
    end

    test "doesn't include milestones ending after tomorrow", ctx do
      project = create_project(ctx, gen_future_date(3))

      create_milestone(project, %{
        status: :pending,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(gen_past_date(3)),
          contextual_end_date: ContextualDate.create_day_date(gen_future_date(2))
        }
      })

      create_milestone(project, %{
        status: :pending,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(gen_past_date(3)),
          contextual_end_date: ContextualDate.create_day_date(gen_future_date(3))
        }
      })

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end

    test "doesn't include milestones that are done", ctx do
      project = create_project(ctx, gen_future_date(3))

      create_milestone(project, %{
        status: :done,
        timeframe: %{
          contextual_start_date: ContextualDate.create_day_date(gen_past_date(3)),
          contextual_end_date: ContextualDate.create_day_date(Date.utc_today())
        }
      })

      assert {200, %{count: count}} = query(ctx.conn, :get_assignments_count_v2, %{})
      assert count == 0
    end
  end

  # --- Helpers ---

  defp tomorrow_date, do: DateTime.add(DateTime.utc_now(), 1, :day)
  defp gen_future_date(days), do: DateTime.add(DateTime.utc_now(), days, :day)
  defp gen_past_date(days), do: DateTime.add(DateTime.utc_now(), -days, :day)

  defp set_up(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:person, :space)
    |> Factory.add_space_member(:another_person, :space)
    |> Factory.log_in_person(:person)
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

  defp acknowledge_check_in(check_in, person) do
    {:ok, check_in} =
      CheckIn.changeset(check_in, %{
        acknowledged_by_id: person.id,
        acknowledged_at: DateTime.utc_now()
      })
      |> Repo.update()

    check_in
  end

  defp acknowledge_goal_update(update, person) do
    {:ok, update} =
      Update.changeset(update, %{
        acknowledged_by_id: person.id,
        acknowledged_at: DateTime.utc_now()
      })
      |> Repo.update()

    update
  end
end
