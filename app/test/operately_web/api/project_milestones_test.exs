defmodule OperatelyWeb.Api.ProjectMilestonesTest do
  use OperatelyWeb.TurboCase
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:engineering)
    |> Factory.add_project(:project, :engineering)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_space_member(:space_member, :engineering)
  end

  describe "list tasks" do
    setup ctx do
      ctx
      |> Factory.add_project_task(:task1, :milestone)
      |> Factory.add_project_task(:task2, :milestone)
      |> Factory.add_project_task(:task3, :milestone)
      |> Factory.add_company_member(:assignee_person)
      |> Factory.add_task_assignee(:assignee, :task3, :assignee_person)
    end

    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:project_milestones, :list_tasks], %{})
    end

    test "it requires a milestone_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{})
      assert res.message == "Missing required fields: milestone_id"
    end

    test "it returns not found for non-existent milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Ecto.UUID.generate()
      })
    end

    test "it returns 404 for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {404, _} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })
    end

    test "it returns 404 for space members without view permission", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :no_access)
        |> Factory.log_in_person(:space_member)

      assert {404, _} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })
    end

    test "it returns tasks for project creator", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert length(res.tasks) == 3
      task_ids = Enum.map(res.tasks, & &1.id)
      assert Paths.task_id(ctx.task1) in task_ids
      assert Paths.task_id(ctx.task2) in task_ids
      assert Paths.task_id(ctx.task3) in task_ids

      # Verify task details are included
      task1 = Enum.find(res.tasks, &(&1.id == Paths.task_id(ctx.task1)))
      assert task1.name == ctx.task1.name
      assert task1.status.value == ctx.task1.task_status.value
      assert task1.milestone.id == Paths.milestone_id(ctx.milestone)
    end

    test "it returns tasks for space members with view access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.log_in_person(:space_member)

      assert {200, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert length(res.tasks) == 3
    end

    test "it returns tasks for project champion", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:champion, :project, role: :champion)
        |> Factory.preload(:champion, :person)

      ctx = log_in_account(ctx, ctx.champion.person)

      assert {200, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert length(res.tasks) == 3
    end

    test "it returns tasks for project reviewer", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer)
        |> Factory.preload(:reviewer, :person)

      ctx = log_in_account(ctx, ctx.reviewer.person)

      assert {200, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert length(res.tasks) == 3
    end

    test "it includes assigned people in task details", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      # Find the task with assignee
      assigned_task = Enum.find(res.tasks, &(&1.id == Paths.task_id(ctx.task3)))

      assert length(assigned_task.assignees) == 1
      assert hd(assigned_task.assignees).id == Paths.person_id(ctx.assignee_person)
    end

    test "it returns empty list for milestone with no tasks", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:empty_milestone, :project)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.empty_milestone)
      })

      assert res.tasks == []
    end

    test "it only returns tasks for the specified milestone", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:other_milestone, :project)
        |> Factory.add_project_task(:other_task, :other_milestone)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      # Should only return tasks from the first milestone, not the other one
      assert length(res.tasks) == 3
      task_ids = Enum.map(res.tasks, & &1.id)
      assert Paths.task_id(ctx.other_task) not in task_ids
    end

    test "it works with milestones from different projects", ctx do
      ctx =
        ctx
        |> Factory.add_project(:other_project, :engineering)
        |> Factory.add_project_milestone(:other_milestone, :other_project)
        |> Factory.add_project_task(:other_task, :other_milestone)
        |> Factory.log_in_person(:creator)

      # Query tasks from first milestone
      assert {200, res1} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      # Query tasks from second milestone
      assert {200, res2} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.other_milestone)
      })

      assert length(res1.tasks) == 3
      assert length(res2.tasks) == 1
      assert hd(res2.tasks).id == Paths.task_id(ctx.other_task)
    end

    test "it includes milestone information in task details", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:project_milestones, :list_tasks], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      task = hd(res.tasks)
      assert task.milestone != nil
      assert task.milestone.id == Paths.milestone_id(ctx.milestone)
      assert task.milestone.title == ctx.milestone.title
    end
  end

  describe "update kanban" do
    setup ctx do
      ctx
      |> Factory.add_project_task(:task, :milestone)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{})
    end

    test "it updates status and kanban state for a milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      status_input =
        Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task)],
        done: [],
        canceled: []
      }

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        task_id: Paths.task_id(ctx.task),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state)
      })

      assert res.task.status.value == "in_progress"

      milestone = Repo.reload(ctx.milestone)
      assert milestone.tasks_kanban_state["in_progress"] == kanban_state.in_progress
    end

    test "it rejects invalid statuses in kanban state", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      status_input =
        Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      invalid_kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task)],
        done: [],
        canceled: [],
        blocked: [Paths.task_id(ctx.task)]
      }

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        task_id: Paths.task_id(ctx.task),
        status: status_input,
        kanban_state: Jason.encode!(invalid_kanban_state)
      })

      assert res.message == "Invalid status blocked"
    end

    test "it updates milestone tasks_kanban_state and only creates activity when task status changes", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      status_input =
        Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task)],
        done: [],
        canceled: []
      }

      before_count = count_task_activities(ctx.task, "task_status_updating")

      assert {200, res1} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        task_id: Paths.task_id(ctx.task),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state)
      })

      assert res1.task.id == Paths.task_id(ctx.task)

      milestone = Repo.reload(ctx.milestone)
      assert milestone.tasks_kanban_state["in_progress"] == kanban_state.in_progress
      assert count_task_activities(ctx.task, "task_status_updating") == before_count + 1

      assert {200, _res2} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        task_id: Paths.task_id(ctx.task),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state)
      })

      assert count_task_activities(ctx.task, "task_status_updating") == before_count + 1
    end

    test "it doesn't create an activity when only the order changes", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task1, :milestone)
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.log_in_person(:creator)

      status_input =
        Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state_1 = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task1), Paths.task_id(ctx.task2)],
        done: [],
        canceled: []
      }

      kanban_state_2 = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task2), Paths.task_id(ctx.task1)],
        done: [],
        canceled: []
      }

      before_count = count_task_activities(ctx.task1, "task_status_updating")

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        task_id: Paths.task_id(ctx.task1),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state_1)
      })

      assert count_task_activities(ctx.task1, "task_status_updating") == before_count + 1

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        task_id: Paths.task_id(ctx.task1),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state_2)
      })

      milestone = Repo.reload(ctx.milestone)
      assert milestone.tasks_kanban_state["in_progress"] == kanban_state_2.in_progress
      assert count_task_activities(ctx.task1, "task_status_updating") == before_count + 1
    end

    test "it doesn't work when the task doesn't belong to the milestone project", ctx do
      ctx =
        ctx
        |> Factory.add_project(:project2, :engineering)
        |> Factory.add_project_milestone(:milestone2, :project2)
        |> Factory.add_project_task(:foreign_task, :milestone2)
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      status_input =
        Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.foreign_task)],
        done: [],
        canceled: []
      }

      assert {404, _} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        task_id: Paths.task_id(ctx.foreign_task),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state)
      })
    end
  end

  describe "update title" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:project_milestones, :update_title], %{})
    end

    test "it requires a milestone_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{title: "New Title"})
      assert res.message == "Missing required fields: milestone_id"
    end

    test "it requires a title", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{milestone_id: Paths.milestone_id(ctx.milestone)})
      assert res.message == "Missing required fields: title"
    end

    test "it returns not found for non-existent milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Ecto.UUID.generate(),
        title: "New Title"
      })
    end

    test "it returns forbidden for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "New Title"
      })
    end

    test "it returns forbidden for space members without edit permission", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.log_in_person(:space_member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "New Title"
      })
    end

    test "it updates the milestone title for project creator", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      original_title = ctx.milestone.title

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "Updated Milestone Title"
      })
      updated_milestone = Repo.reload(ctx.milestone)

      assert res.milestone.title == "Updated Milestone Title"
      assert res.milestone.id == Paths.milestone_id(updated_milestone)

      assert updated_milestone.title == "Updated Milestone Title"
      assert updated_milestone.title != original_title
    end

    test "it updates the milestone title for space members with full access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :full_access)
        |> Factory.log_in_person(:space_member)

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "Updated by Space Member"
      })

      assert res.milestone.title == "Updated by Space Member"

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.title == "Updated by Space Member"
    end

    test "it updates the milestone title for project champion", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:champion, :project, role: :champion, permissions: :full_access)
        |> Factory.preload(:champion, :person)

      ctx = log_in_account(ctx, ctx.champion.person)

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "Updated by Champion"
      })

      assert res.milestone.title == "Updated by Champion"

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.title == "Updated by Champion"
    end

    test "it updates the milestone title for project reviewer", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer, permissions: :full_access)
        |> Factory.preload(:reviewer, :person)

      ctx = log_in_account(ctx, ctx.reviewer.person)

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "Updated by Reviewer"
      })

      assert res.milestone.title == "Updated by Reviewer"

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.title == "Updated by Reviewer"
    end

    test "it preserves other milestone fields when updating title", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      original_status = ctx.milestone.status
      original_timeframe = ctx.milestone.timeframe
      original_project_id = ctx.milestone.project_id

      assert {200, _res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "New Title Only"
      })

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.title == "New Title Only"
      assert updated_milestone.status == original_status
      assert updated_milestone.timeframe == original_timeframe
      assert updated_milestone.project_id == original_project_id
    end

    test "it validates title is not empty", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: ""
      })

      assert res.message == "Title cannot be empty"
    end

    test "it creates an activity when title is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.milestone.id, "milestone_title_updating")

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "Activity Test Title"
      })

      after_count = count_activities(ctx.milestone.id, "milestone_title_updating")
      assert after_count == before_count + 1

      activity = get_activity(ctx.milestone.id, "milestone_title_updating")
      assert activity.content["milestone_id"] == ctx.milestone.id
      assert activity.content["project_id"] == ctx.project.id
      assert activity.content["company_id"] == ctx.project.company_id
      assert activity.content["space_id"] == ctx.project.group_id
      assert activity.content["old_title"] == ctx.milestone.title
      assert activity.content["new_title"] == "Activity Test Title"
    end

    test "it handles special characters in title", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      special_title = "Release v2.0 🚀 - Q1 2024 (Critical)"

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: special_title
      })

      assert res.milestone.title == special_title

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.title == special_title
    end

    test "it handles long titles", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      long_title = String.duplicate("A", 255)

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: long_title
      })

      assert res.milestone.title == long_title

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.title == long_title
    end

    test "it works with milestones from different projects", ctx do
      ctx =
        ctx
        |> Factory.add_project(:other_project, :engineering)
        |> Factory.add_project_milestone(:other_milestone, :other_project)
        |> Factory.log_in_person(:creator)

      # Update milestone from first project
      assert {200, res1} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        title: "Project 1 Milestone"
      })

      # Update milestone from second project
      assert {200, res2} = mutation(ctx.conn, [:project_milestones, :update_title], %{
        milestone_id: Paths.milestone_id(ctx.other_milestone),
        title: "Project 2 Milestone"
      })

      assert res1.milestone.title == "Project 1 Milestone"
      assert res2.milestone.title == "Project 2 Milestone"

      # Verify both milestones were updated correctly
      updated_milestone1 = Repo.reload(ctx.milestone)
      updated_milestone2 = Repo.reload(ctx.other_milestone)

      assert updated_milestone1.title == "Project 1 Milestone"
      assert updated_milestone2.title == "Project 2 Milestone"
    end
  end

  describe "update due date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{})
    end

    test "it requires a milestone_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{due_date: %{date: "2026-01-01", date_type: "day"}})
      assert res.message == "Missing required fields: milestone_id"
    end

    test "it returns not found for non-existent milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Ecto.UUID.generate(),
        due_date: %{date: "2026-01-01", date_type: "day"}
      })
    end

    test "it returns forbidden for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: %{date: "2026-01-01", date_type: "day"}
      })
    end

    test "it returns forbidden for space members without edit permission", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.log_in_person(:space_member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: %{date: "2026-01-01", date_type: "day"}
      })
    end

    test "it updates the milestone due date for project creator", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: contextual_date
      })

      assert res.milestone.id == Paths.milestone_id(ctx.milestone)
      assert res.milestone.timeframe.contextual_end_date == contextual_date

      updated_milestone = Repo.reload(ctx.milestone)
      assert Operately.ContextualDates.Timeframe.end_date(updated_milestone.timeframe) == ~D[2026-01-01]
    end

    test "it can set due date to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: nil
      })

      assert res.milestone.id == Paths.milestone_id(ctx.milestone)

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.timeframe == nil || updated_milestone.timeframe.contextual_end_date == nil
    end

    test "it preserves start date when updating due date", ctx do
      # First set a timeframe with both start and end dates
      {:ok, milestone_with_timeframe} = Operately.Projects.update_milestone(ctx.milestone, %{
        timeframe: %{
          contextual_start_date: %{date: "2025-12-01", date_type: "day", value: "Dec 1, 2025"},
          contextual_end_date: %{date: "2025-12-31", date_type: "day", value: "Dec 31, 2025"}
        }
      })

      ctx = %{ctx | milestone: milestone_with_timeframe}
      ctx = Factory.log_in_person(ctx, :creator)

      new_due_date = %{
        date: "2026-03-15",
        date_type: "day",
        value: "Mar 15, 2026"
      }

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: new_due_date
      })

      updated_milestone = Repo.reload(ctx.milestone)
      assert Operately.ContextualDates.Timeframe.start_date(updated_milestone.timeframe) == ~D[2025-12-01]
      assert Operately.ContextualDates.Timeframe.end_date(updated_milestone.timeframe) == ~D[2026-03-15]
    end

    test "it creates timeframe when milestone has none", ctx do
      # Ensure milestone has no timeframe
      {:ok, milestone_no_timeframe} = Operately.Projects.update_milestone(ctx.milestone, %{timeframe: nil})
      ctx = %{ctx | milestone: milestone_no_timeframe}
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2026-06-01",
        date_type: "day",
        value: "Jun 1, 2026"
      }

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: contextual_date
      })

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.timeframe != nil
      assert Operately.ContextualDates.Timeframe.start_date(updated_milestone.timeframe) == nil
      assert Operately.ContextualDates.Timeframe.end_date(updated_milestone.timeframe) == ~D[2026-06-01]
    end

    test "it updates due date for space members with full access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :full_access)
        |> Factory.log_in_person(:space_member)

      contextual_date = %{
        date: "2026-02-14",
        date_type: "day",
        value: "Feb 14, 2026"
      }

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: contextual_date
      })

      updated_milestone = Repo.reload(ctx.milestone)
      assert Operately.ContextualDates.Timeframe.end_date(updated_milestone.timeframe) == ~D[2026-02-14]
    end

    test "it creates an activity when due date is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.milestone.id, "milestone_due_date_updating")

      contextual_date = %{
        "date" => "2026-04-01",
        "date_type" => "day",
        "value" => "Apr 1, 2026"
      }

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: contextual_date
      })

      after_count = count_activities(ctx.milestone.id, "milestone_due_date_updating")
      assert after_count == before_count + 1

      activity = get_activity(ctx.milestone.id, "milestone_due_date_updating")
      assert activity.content["milestone_id"] == ctx.milestone.id
      assert activity.content["project_id"] == ctx.project.id
      assert activity.content["company_id"] == ctx.project.company_id
      assert activity.content["space_id"] == ctx.project.group_id
      assert activity.content["new_due_date"] == contextual_date
    end

    test "it handles different date types", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      quarter_date = %{
        date: "2026-06-01",
        date_type: "quarter",
        value: "Q2 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: quarter_date
      })

      assert res.milestone.timeframe.contextual_end_date == quarter_date
    end

    test "it works with milestones from different projects", ctx do
      ctx =
        ctx
        |> Factory.add_project(:other_project, :engineering)
        |> Factory.add_project_milestone(:other_milestone, :other_project)
        |> Factory.log_in_person(:creator)

      date1 = %{date: "2026-01-15", date_type: "day", value: "Jan 15, 2026"}
      date2 = %{date: "2026-02-15", date_type: "day", value: "Feb 15, 2026"}

      # Update milestone from first project
      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        due_date: date1
      })

      # Update milestone from second project
      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
        milestone_id: Paths.milestone_id(ctx.other_milestone),
        due_date: date2
      })

      # Verify both milestones were updated correctly
      updated_milestone1 = Repo.reload(ctx.milestone)
      updated_milestone2 = Repo.reload(ctx.other_milestone)

      assert Operately.ContextualDates.Timeframe.end_date(updated_milestone1.timeframe) == ~D[2026-01-15]
      assert Operately.ContextualDates.Timeframe.end_date(updated_milestone2.timeframe) == ~D[2026-02-15]
    end
  end

  describe "update description" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:project_milestones, :update_description], %{})
    end

    test "it requires a milestone_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_description], %{description: RichText.rich_text("Test description", :as_string)})
      assert res.message == "Missing required fields: milestone_id"
    end

    test "it requires a description", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_description], %{milestone_id: Paths.milestone_id(ctx.milestone)})
      assert res.message == "Missing required fields: description"
    end

    test "it returns not found for non-existent milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Ecto.UUID.generate(),
        description: RichText.rich_text("Test description", :as_string)
      })
    end

    test "it returns forbidden for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: RichText.rich_text("Test description", :as_string)
      })
    end

    test "it returns forbidden for space members without edit permission", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.log_in_person(:space_member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: RichText.rich_text("Test description", :as_string)
      })
    end

    test "it updates the milestone description for project creator", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      description = RichText.rich_text("Updated milestone description")

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: Jason.encode!(description)
      })

      assert res.milestone.description == Jason.encode!(description)
      assert res.milestone.id == Paths.milestone_id(ctx.milestone)

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.description == description
    end

    test "it updates the milestone description for space members with full access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :full_access)
        |> Factory.log_in_person(:space_member)

      description = RichText.rich_text("Updated by space member")

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: Jason.encode!(description)
      })

      assert res.milestone.description == Jason.encode!(description)

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.description == description
    end

    test "it updates the milestone description for project champion", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:champion, :project, role: :champion, permissions: :full_access)
        |> Factory.preload(:champion, :person)

      ctx = log_in_account(ctx, ctx.champion.person)

      description = RichText.rich_text("Updated by champion")

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: Jason.encode!(description)
      })

      assert res.milestone.description == Jason.encode!(description)

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.description == description
    end

    test "it updates the milestone description for project reviewer", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer, permissions: :full_access)
        |> Factory.preload(:reviewer, :person)

      ctx = log_in_account(ctx, ctx.reviewer.person)

      description = RichText.rich_text("Updated by reviewer")

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: Jason.encode!(description)
      })

      assert res.milestone.description == Jason.encode!(description)

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.description == description
    end

    test "it preserves other milestone fields when updating description", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      original_title = ctx.milestone.title
      original_status = ctx.milestone.status
      original_timeframe = ctx.milestone.timeframe
      original_project_id = ctx.milestone.project_id

      description = RichText.rich_text("New description only")

      assert {200, _res} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: Jason.encode!(description)
      })

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.description == description
      assert updated_milestone.title == original_title
      assert updated_milestone.status == original_status
      assert updated_milestone.timeframe == original_timeframe
      assert updated_milestone.project_id == original_project_id
    end

    test "it can set description to empty", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      empty_description = RichText.rich_text("")

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: Jason.encode!(empty_description)
      })

      assert res.milestone.description == Jason.encode!(empty_description)

      updated_milestone = Repo.reload(ctx.milestone)
      assert updated_milestone.description == empty_description
    end

    test "it creates an activity when description is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.milestone.id, "milestone_description_updating")

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: RichText.rich_text("Activity test description", :as_string)
      })

      after_count = count_activities(ctx.milestone.id, "milestone_description_updating")
      assert after_count == before_count + 1

      activity = get_activity(ctx.milestone.id, "milestone_description_updating")
      assert activity.content["milestone_id"] == ctx.milestone.id
      assert activity.content["project_id"] == ctx.project.id
      assert activity.content["company_id"] == ctx.project.company_id
      assert activity.content["space_id"] == ctx.project.group_id
      assert activity.content["milestone_name"] == ctx.milestone.title
      assert activity.content["has_description"] == true
    end

    test "it tracks has_description correctly for empty descriptions", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :update_description], %{
        milestone_id: Paths.milestone_id(ctx.milestone),
        description: RichText.rich_text("", :as_string)
      })

      activity = get_activity(ctx.milestone.id, "milestone_description_updating")
      assert activity.content["has_description"] == false
    end
  end

  describe "update ordering" do
    setup ctx do
      ctx
      |> Factory.add_project_milestone(:milestone2, :project)
      |> Factory.add_project_milestone(:milestone3, :project)
    end

    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:project_milestones, :update_ordering], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_ordering], %{ordering_state: []})

      assert res.message == "Missing required fields: project_id"
    end

    test "it returns not found for non-existent project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      fake_project = %Operately.Projects.Project{id: Ecto.UUID.generate(), name: "Missing"}

      assert {404, _} = mutation(ctx.conn, [:project_milestones, :update_ordering], %{
        project_id: Paths.project_id(fake_project),
        ordering_state: []
      })
    end

    test "it returns forbidden for members without edit access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.log_in_person(:space_member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :update_ordering], %{
        project_id: Paths.project_id(ctx.project),
        ordering_state: []
      })
    end

    test "it rejects milestones from other projects", ctx do
      ctx =
        ctx
        |> Factory.add_project(:other_project, :engineering)
        |> Factory.add_project_milestone(:other_milestone, :other_project)
        |> Factory.log_in_person(:creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :update_ordering], %{
        project_id: Paths.project_id(ctx.project),
        ordering_state: [
          Paths.milestone_id(ctx.milestone),
          Paths.milestone_id(ctx.other_milestone)
        ]
      })

      assert res.message == "Some milestone IDs do not belong to this project"
    end

    test "it appends missing milestone ids when saving", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      partial_state = [Paths.milestone_id(ctx.milestone3)]

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_ordering], %{
        project_id: Paths.project_id(ctx.project),
        ordering_state: partial_state
      })

      project_after = Repo.reload(ctx.project)

      expected_order = [
        Paths.milestone_id(ctx.milestone3),
        Paths.milestone_id(ctx.milestone),
        Paths.milestone_id(ctx.milestone2)
      ]

      assert project_after.milestones_ordering_state == expected_order
      assert res.project.milestones_ordering_state == expected_order
    end

    test "it reorders milestones and returns updated ordering", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      new_order = [
        Paths.milestone_id(ctx.milestone2),
        Paths.milestone_id(ctx.milestone3),
        Paths.milestone_id(ctx.milestone)
      ]

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :update_ordering], %{
        project_id: Paths.project_id(ctx.project),
        ordering_state: new_order
      })

      project_after = Repo.reload(ctx.project)

      assert project_after.milestones_ordering_state == new_order
      assert res.project.milestones_ordering_state == new_order
    end
  end

  describe "delete" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:project_milestones, :delete], %{})
    end

    test "it requires a milestone_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:project_milestones, :delete], %{})
      assert res.message == "Missing required fields: milestone_id"
    end

    test "it returns not found for non-existent milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Ecto.UUID.generate()
      })
    end

    test "it returns forbidden for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })
    end

    test "it returns forbidden for space members without edit access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :comment_access)
        |> Factory.log_in_person(:space_member)

      assert {403, _} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })
    end

    test "it deletes the milestone for project creator", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      milestone_id = ctx.milestone.id

      project_before = Repo.reload(ctx.project)
      assert project_before.milestones_ordering_state == [Paths.milestone_id(ctx.milestone)]

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert res.success == true

      # Verify milestone is deleted
      assert Repo.get(Operately.Projects.Milestone, milestone_id) == nil

      project_after = Repo.reload(project_before)
      assert project_after.milestones_ordering_state == []
    end

    test "it deletes the milestone for space members with full access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :full_access)
        |> Factory.log_in_person(:space_member)

      milestone_id = ctx.milestone.id

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert res.success == true

      # Verify milestone is deleted
      assert Repo.get(Operately.Projects.Milestone, milestone_id) == nil
    end

    test "it deletes the milestone for project champion", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:champion, :project, role: :champion, permissions: :full_access)
        |> Factory.preload(:champion, :person)

      ctx = log_in_account(ctx, ctx.champion.person)
      milestone_id = ctx.milestone.id

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert res.success == true

      # Verify milestone is deleted
      assert Repo.get(Operately.Projects.Milestone, milestone_id) == nil
    end

    test "it deletes the milestone for project reviewer", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer, permissions: :full_access)
        |> Factory.preload(:reviewer, :person)

      ctx = log_in_account(ctx, ctx.reviewer.person)
      milestone_id = ctx.milestone.id

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert res.success == true

      # Verify milestone is deleted
      assert Repo.get(Operately.Projects.Milestone, milestone_id) == nil
    end

    test "it creates an activity when milestone is deleted", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.milestone.id, "milestone_deleting")
      milestone_name = ctx.milestone.title

      assert {200, _} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      after_count = count_activities(ctx.milestone.id, "milestone_deleting")
      assert after_count == before_count + 1

      activity = get_activity(ctx.milestone.id, "milestone_deleting")
      assert activity.content["milestone_id"] == ctx.milestone.id
      assert activity.content["project_id"] == ctx.project.id
      assert activity.content["company_id"] == ctx.project.company_id
      assert activity.content["space_id"] == ctx.project.group_id
      assert activity.content["milestone_name"] == milestone_name
    end

    test "it works with milestones from different projects", ctx do
      ctx =
        ctx
        |> Factory.add_project(:other_project, :engineering)
        |> Factory.add_project_milestone(:other_milestone, :other_project)
        |> Factory.log_in_person(:creator)

      milestone1_id = ctx.milestone.id
      milestone2_id = ctx.other_milestone.id

      # Delete milestone from first project
      assert {200, res1} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      # Delete milestone from second project
      assert {200, res2} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.other_milestone)
      })

      assert res1.success == true
      assert res2.success == true

      # Verify both milestones are deleted
      assert Repo.get(Operately.Projects.Milestone, milestone1_id) == nil
      assert Repo.get(Operately.Projects.Milestone, milestone2_id) == nil
    end

    test "it handles deletion of milestone with no tasks", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      milestone_id = ctx.milestone.id

      # Ensure milestone has no tasks (should be the default)
      tasks = Operately.Tasks.list_tasks(%{milestone_id: milestone_id})
      assert length(tasks) == 0

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert res.success == true
      assert Repo.get(Operately.Projects.Milestone, milestone_id) == nil
    end

    test "it handles deletion of milestone with description", ctx do
      # Set up milestone with description
      description = %{"type" => "doc", "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Test description"}]}]}
      {:ok, milestone_with_desc} = Operately.Projects.update_milestone(ctx.milestone, %{description: description})

      ctx = %{ctx | milestone: milestone_with_desc}
      ctx = Factory.log_in_person(ctx, :creator)
      milestone_id = ctx.milestone.id

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert res.success == true
      assert Repo.get(Operately.Projects.Milestone, milestone_id) == nil
    end

    test "it handles deletion of milestone with timeframe", ctx do
      # Set up milestone with timeframe
      timeframe = %{
        contextual_start_date: %{date: "2025-01-01", date_type: "day", value: "Jan 1, 2025"},
        contextual_end_date: %{date: "2025-12-31", date_type: "day", value: "Dec 31, 2025"}
      }
      {:ok, milestone_with_timeframe} = Operately.Projects.update_milestone(ctx.milestone, %{timeframe: timeframe})

      ctx = %{ctx | milestone: milestone_with_timeframe}
      ctx = Factory.log_in_person(ctx, :creator)
      milestone_id = ctx.milestone.id

      assert {200, res} = mutation(ctx.conn, [:project_milestones, :delete], %{
        milestone_id: Paths.milestone_id(ctx.milestone)
      })

      assert res.success == true
      assert Repo.get(Operately.Projects.Milestone, milestone_id) == nil
    end
  end

  #
  # Utility functions
  #

  import Ecto.Query, only: [from: 2]

  defp count_task_activities(task, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["task_id"] == ^task.id
    )
    |> Repo.aggregate(:count)
  end

  defp count_activities(milestone_id, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["milestone_id"] == ^milestone_id
    )
    |> Repo.aggregate(:count)
  end

  defp get_activity(milestone_id, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["milestone_id"] == ^milestone_id
    )
    |> Repo.one()
  end
end
