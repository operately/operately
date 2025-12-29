defmodule OperatelyWeb.Api.ProjectsTest do
  alias Operately.ContextualDates.{Timeframe, ContextualDate}

  use OperatelyWeb.TurboCase
  use Operately.Support.Notifications

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:engineering)
    |> Factory.add_project(:project, :engineering)
    |> Factory.add_space_member(:new_champion, :engineering)
    |> Factory.add_project_milestone(:milestone, :project)
  end

  describe "get milestones" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:projects, :get_milestones], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:projects, :get_milestones], %{})
      assert res.message == "Missing required fields: project_id"
    end

    test "it returns not found for non-existent project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = query(ctx.conn, [:projects, :get_milestones], %{
        project_id: Ecto.UUID.generate()
      })
    end

    test "it returns not found for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {404, _} = query(ctx.conn, [:projects, :get_milestones], %{
        project_id: Paths.project_id(ctx.project)
      })
    end

    test "it returns milestones for project creator", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_milestones], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.milestones) == 1
      assert hd(res.milestones).id == Paths.milestone_id(ctx.milestone)
      assert hd(res.milestones).title == ctx.milestone.title
    end

    test "it returns milestones for space members with view access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:space_member)

      assert {200, res} = query(ctx.conn, [:projects, :get_milestones], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.milestones) == 1
      assert hd(res.milestones).id == Paths.milestone_id(ctx.milestone)
    end

    test "it returns empty list when project has no milestones", ctx do
      ctx =
        ctx
        |> Factory.add_project(:empty_project, :engineering)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_milestones], %{
        project_id: Paths.project_id(ctx.empty_project)
      })

      assert res.milestones == []
    end

    test "it returns multiple milestones when project has multiple milestones", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.add_project_milestone(:milestone3, :project)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_milestones], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.milestones) == 3
      milestone_ids = Enum.map(res.milestones, & &1.id)
      assert Paths.milestone_id(ctx.milestone) in milestone_ids
      assert Paths.milestone_id(ctx.milestone2) in milestone_ids
      assert Paths.milestone_id(ctx.milestone3) in milestone_ids
    end

    test "it returns milestones in chronological order", ctx do
      # Add milestones with different timestamps
      ctx =
        ctx
        |> Factory.add_project_milestone(:milestone2, :project)
        |> Factory.add_project_milestone(:milestone3, :project)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_milestones], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.milestones) == 3
      # Verify they are ordered by creation time (first milestone should be first)
      assert hd(res.milestones).id == Paths.milestone_id(ctx.milestone)
    end

    test "it includes tasks_ordering_state in milestone data", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_milestones], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.milestones) == 1
      milestone = hd(res.milestones)
      assert Map.has_key?(milestone, :tasks_ordering_state)
    end
  end

  describe "get contributors" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:projects, :get_contributors], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:projects, :get_contributors], %{})
      assert res.message == "Missing required fields: project_id"
    end

    test "it returns not found for non-existent project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Ecto.UUID.generate()
      })
    end

    test "it returns not found for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {404, _} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project)
      })
    end

    test "it returns contributors for project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.contributors) > 0
      contributor_ids = Enum.map(res.contributors, & &1.id)
      assert Paths.person_id(ctx.creator) in contributor_ids
    end

    test "it returns all contributors including champion and reviewer", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer)
        |> Factory.preload(:reviewer, :person)
        |> Factory.add_project_contributor(:champion, :project, role: :champion)
        |> Factory.preload(:champion, :person)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert length(res.contributors) >= 3
      contributor_ids = Enum.map(res.contributors, & &1.id)

      assert Paths.person_id(ctx.creator) in contributor_ids
      assert Paths.person_id(ctx.reviewer.person) in contributor_ids
    end

    test "it filters contributors by name with query parameter", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:special_contributor, :project, name: "Special Person", role: :contributor)
        |> Factory.preload(:special_contributor, :person)
        |> Factory.add_project_contributor(:another_contributor, :project, name: "Another Regular Person", role: :contributor)
        |> Factory.preload(:another_contributor, :person)
        |> Factory.log_in_person(:creator)

      assert {200, res1} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project),
        query: "Special"
      })

      assert length(res1.contributors) == 1
      assert hd(res1.contributors).id == Paths.person_id(ctx.special_contributor.person)
      assert hd(res1.contributors).full_name == "Special Person"

      assert {200, res2} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project),
        query: "Person"
      })

      assert length(res2.contributors) == 2
      contributor_names = Enum.map(res2.contributors, & &1.full_name)
      assert "Special Person" in contributor_names
      assert "Another Regular Person" in contributor_names

      # Test case insensitivity
      assert {200, res3} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project),
        query: "special"
      })

      assert length(res3.contributors) == 1
      assert hd(res3.contributors).id == Paths.person_id(ctx.special_contributor.person)
    end

    test "it returns empty list when query doesn't match any contributors", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project),
        query: "NonExistentNameOrEmail"
      })

      assert res.contributors == []
    end

    test "it excludes contributors with IDs in ignored_ids", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:test_contributor, :project, name: "Test Person", role: :contributor)
        |> Factory.preload(:test_contributor, :person)
        |> Factory.log_in_person(:creator)

      # Get all contributors first
      assert {200, res1} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project)
      })

      test_contributor_id = Paths.person_id(ctx.test_contributor.person)

      contributor_ids = Enum.map(res1.contributors, & &1.id)
      assert test_contributor_id in contributor_ids

      # Now exclude it using ignored_ids
      assert {200, res2} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project),
        ignored_ids: [test_contributor_id]
      })

      filtered_ids = Enum.map(res2.contributors, & &1.id)
      refute test_contributor_id in filtered_ids

      assert length(res2.contributors) == length(res1.contributors) - 1
    end

    test "it does not include contributors from other projects", ctx do
      ctx =
        ctx
        |> Factory.add_project(:other_project, :engineering)
        |> Factory.add_project_contributor(:other_project_contributor, :other_project, name: "Other Project Person", role: :contributor)
        |> Factory.preload(:other_project_contributor, :person)
        |> Factory.log_in_person(:creator)

      # Get contributors for the first project
      assert {200, res} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project)
      })

      contributor_ids = Enum.map(res.contributors, & &1.id)

      other_contributor_id = Paths.person_id(ctx.other_project_contributor.person)
      refute other_contributor_id in contributor_ids

      # Also verify we can get the other project's contributors separately
      assert {200, other_res} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.other_project)
      })

      other_project_contributor_ids = Enum.map(other_res.contributors, & &1.id)
      assert other_contributor_id in other_project_contributor_ids
    end

    test "it returns all contributors when query is empty", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Get all contributors first without query
      assert {200, res1} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project)
      })

      all_contributors_count = length(res1.contributors)
      assert all_contributors_count > 0

      # Test with empty query
      assert {200, res2} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project),
        query: ""
      })

      assert length(res2.contributors) == all_contributors_count
    end

    test "it includes champion in contributors", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:champion, :project, role: :champion)
        |> Factory.preload(:champion, :person)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :get_contributors], %{
        project_id: Paths.project_id(ctx.project)
      })

      contributor_ids = Enum.map(res.contributors, & &1.id)
      assert Paths.person_id(ctx.champion.person) in contributor_ids
    end
  end

  describe "count children" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:projects, :count_children], %{})
    end

    test "it requires an id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = query(ctx.conn, [:projects, :count_children], %{})
      assert res.message == "Missing required fields: id"
    end

    test "it returns 404 if the project does not exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = query(ctx.conn, [:projects, :count_children], %{
        id: Ecto.UUID.generate()
      })
    end

    test "it returns counts for project by default", ctx do
      ctx =
        ctx
        |> Factory.add_project_discussion(:discussion1, :project)
        |> Factory.add_project_discussion(:discussion2, :project)
        |> Factory.add_project_task(:task1, :milestone)
        |> Factory.add_project_task(:task2, :milestone)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :count_children], %{
        id: Paths.project_id(ctx.project)
      })

      assert res.children_count.discussions_count == 2
      assert res.children_count.tasks_count == 2
      assert res.children_count.check_ins_count == 0
    end

    test "it returns 0 counts when project has no children", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:projects, :count_children], %{
        id: Paths.project_id(ctx.project)
      })

      assert res.children_count.discussions_count == 0
      assert res.children_count.tasks_count == 0
      assert res.children_count.check_ins_count == 0
    end

    test "it finds project by task_id when use_task_id is true", ctx do
      ctx =
        ctx
        |> Factory.add_project_discussion(:discussion1, :project)
        |> Factory.add_project_task(:task1, :milestone)
        |> Factory.add_project_check_in(:check_in1, :project, :creator)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :count_children], %{
        id: Paths.task_id(ctx.task1),
        use_task_id: true
      })

      assert res.children_count.discussions_count == 1
      assert res.children_count.tasks_count == 1
      assert res.children_count.check_ins_count == 1
    end

    test "it finds project by milestone_id when use_milestone_id is true", ctx do
      ctx =
        ctx
        |> Factory.add_project_discussion(:discussion1, :project)
        |> Factory.add_project_task(:task1, :milestone)
        |> Factory.add_project_check_in(:check_in1, :project, :creator)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :count_children], %{
        id: Paths.milestone_id(ctx.milestone),
        use_milestone_id: true
      })

      assert res.children_count.discussions_count == 1
      assert res.children_count.tasks_count == 1
      assert res.children_count.check_ins_count == 1
    end

    test "it returns 404 when task does not exist with use_task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, res} = query(ctx.conn, [:projects, :count_children], %{
        id: Ecto.UUID.generate(),
        use_task_id: true
      })

      assert res.message == "Task not found"
    end

    test "it returns 404 when milestone does not exist with use_milestone_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, res} = query(ctx.conn, [:projects, :count_children], %{
        id: Ecto.UUID.generate(),
        use_milestone_id: true
      })

      assert res.message == "Milestone not found"
    end

    test "it excludes done and canceled tasks from count", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task1, :milestone, status: "todo")
        |> Factory.add_project_task(:task2, :milestone, status: "done")
        |> Factory.add_project_task(:task3, :milestone, status: "canceled")
        |> Factory.add_project_task(:task4, :milestone, status: "in_progress")
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, [:projects, :count_children], %{
        id: Paths.project_id(ctx.project)
      })

      # Should only count todo and in_progress tasks (2 tasks)
      assert res.children_count.tasks_count == 2
      assert res.children_count.discussions_count == 0
      assert res.children_count.check_ins_count == 0
    end
   end

  describe "update due date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_due_date], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_due_date], %{due_date: %{date: "2023-01-01", date_type: "day"}})
      assert res.message == "Missing required fields: project_id"
    end

    test "it updates the due date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: contextual_date
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :project)
      assert Timeframe.end_date(ctx.project.timeframe) == ~D[2026-01-01]
    end

    test "it can update the due date to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: nil
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :project)
      assert ctx.project.timeframe.contextual_end_date == nil
    end

    test "it creates an activity when due date is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      before_count = count_activities(ctx.project.id, "project_due_date_updating")

      assert {200, _} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: contextual_date
      })

      after_count = count_activities(ctx.project.id, "project_due_date_updating")
      assert after_count == before_count + 1
    end

    test "it notifies project subscribers when the due date is updated", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:subscriber, :project, :as_person)
        |> Factory.log_in_person(:creator)

      action = "project_due_date_updating"
      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert notifications_count(action: action) == 0

      assert {200, _} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: contextual_date
      })

      activity = get_activity(ctx.project.id, action)
      assert activity.content["project_id"] == ctx.project.id
      assert activity.content["new_due_date"] != nil

      assert notifications_count(action: action) == 1

      notifications = fetch_notifications(activity.id, action: action)
      assert Enum.any?(notifications, &(&1.person_id == ctx.subscriber.id))
    end
  end

  describe "update start date" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_start_date], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_start_date], %{start_date: %{date: "2023-01-01", date_type: "day"}})
      assert res.message == "Missing required fields: project_id"
    end

    test "it updates the start date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2025-01-01",
        date_type: "day",
        value: "Jan 1, 2025"
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :update_start_date], %{
        project_id: Paths.project_id(ctx.project),
        start_date: contextual_date
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :project)
      assert Timeframe.start_date(ctx.project.timeframe) == ~D[2025-01-01]
    end

    test "it can update the start date to nil", ctx do
      # First set a timeframe with an end date
      ctx = Factory.log_in_person(ctx, :creator)

      end_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert {200, _} = mutation(ctx.conn, [:projects, :update_due_date], %{
        project_id: Paths.project_id(ctx.project),
        due_date: end_date
      })

      # Then test setting the start date to nil
      assert {200, res} = mutation(ctx.conn, [:projects, :update_start_date], %{
        project_id: Paths.project_id(ctx.project),
        start_date: nil
      })
      assert res.success == true

      ctx = Factory.reload(ctx, :project)
      assert ctx.project.timeframe != nil
      assert Timeframe.start_date(ctx.project.timeframe) == nil
      assert Timeframe.end_date(ctx.project.timeframe) == ~D[2026-01-01]
    end

    test "it creates an activity when start date is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2025-01-01",
        date_type: "day",
        value: "Jan 1, 2025"
      }

      before_count = count_activities(ctx.project.id, "project_start_date_updating")

      assert {200, _} = mutation(ctx.conn, [:projects, :update_start_date], %{
        project_id: Paths.project_id(ctx.project),
        start_date: contextual_date
      })

      after_count = count_activities(ctx.project.id, "project_start_date_updating")
      assert after_count == before_count + 1
    end
  end

  describe "update task statuses" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_task_statuses], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        task_statuses: [
          %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
        ]
      })

      assert res.message == "Missing required fields: project_id"
    end

    test "it requires at least one task status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        project_id: Paths.project_id(ctx.project),
        task_statuses: []
      })

      assert res.message == "At least one task status is required"
    end

    test "it updates task statuses for the project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_progress", label: "In progress", color: "blue", index: 1, value: "in_progress", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: false}
      ]

      assert {200, res} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        project_id: Paths.project_id(ctx.project),
        task_statuses: statuses
      })

      assert res.success == true

      project = Repo.reload(ctx.project)

      assert length(project.task_statuses) == 3
      assert Enum.map(project.task_statuses, & &1.label) == ["Todo", "In progress", "Done"]
    end

    test "validation fails when replacement status does not exist in new statuses", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Try to delete "old_status" and replace with "nonexistent" which is not in the new statuses list
      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]

      assert {400, res} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        project_id: Paths.project_id(ctx.project),
        task_statuses: new_statuses,
        deleted_status_replacements: [
          %{deleted_status_id: "old_status", replacement_status_id: "nonexistent"}
        ]
      })

      assert res.message == "Replacement statuses must be existing statuses that are not being deleted"
    end

    test "validation fails when replacement status is also being deleted", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Try to delete both "status_a" and "status_b", but use "status_b" as replacement for "status_a"
      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false}
      ]

      assert {400, res} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        project_id: Paths.project_id(ctx.project),
        task_statuses: new_statuses,
        deleted_status_replacements: [
          %{deleted_status_id: "status_a", replacement_status_id: "status_b"},
          %{deleted_status_id: "status_b", replacement_status_id: "todo"}
        ]
      })

      assert res.message == "Replacement statuses must be existing statuses that are not being deleted"
    end

    test "tasks with deleted statuses are updated to replacement status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First, set up the project with custom statuses
      old_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_review", label: "In Review", color: "blue", index: 1, value: "in_review", closed: false},
        %{id: "blocked", label: "Blocked", color: "red", index: 2, value: "blocked", closed: false},
        %{id: "done", label: "Done", color: "green", index: 3, value: "done", closed: true}
      ]

      assert {200, _} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        project_id: Paths.project_id(ctx.project),
        task_statuses: old_statuses
      })

      # Create tasks with statuses, then delete two of the statuses.
      project = Repo.reload(ctx.project)
      in_review_status = Enum.find(project.task_statuses, & &1.id == "in_review")
      blocked_status = Enum.find(project.task_statuses, & &1.id == "blocked")
      done_status = Enum.find(project.task_statuses, & &1.id == "done")

      ctx = Factory.add_project_task(ctx, :task_in_review, :milestone, [
        name: "Task in review",
        task_status: Map.from_struct(in_review_status)
      ])

      ctx = Factory.add_project_task(ctx, :task_blocked, :milestone, [
        name: "Task blocked",
        task_status: Map.from_struct(blocked_status)
      ])

      ctx = Factory.add_project_task(ctx, :task_done, :milestone, [
        name: "Task done",
        task_status: Map.from_struct(done_status)
      ])

      task_in_review = Repo.reload(ctx.task_in_review)
      assert task_in_review.task_status.id == "in_review"
      assert task_in_review.task_status.label == "In Review"

      task_blocked = Repo.reload(ctx.task_blocked)
      assert task_blocked.task_status.id == "blocked"
      assert task_blocked.task_status.label == "Blocked"

      task_done = Repo.reload(ctx.task_done)
      assert task_done.task_status.id == "done"
      assert task_done.task_status.label == "Done"

      # Now update statuses, deleting "in_review" and "blocked" and replacing them with "todo"
      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "done", label: "Done", color: "green", index: 1, value: "done", closed: true}
      ]

      assert {200, res} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        project_id: Paths.project_id(ctx.project),
        task_statuses: new_statuses,
        deleted_status_replacements: [
          %{deleted_status_id: "in_review", replacement_status_id: "todo"},
          %{deleted_status_id: "blocked", replacement_status_id: "todo"}
        ]
      })

      assert res.success == true

      # Verify only tasks with deleted statuses were updated
      task_in_review = Repo.reload(ctx.task_in_review)
      assert task_in_review.task_status.id == "todo"
      assert task_in_review.task_status.label == "Todo"

      task_blocked = Repo.reload(ctx.task_blocked)
      assert task_blocked.task_status.id == "todo"
      assert task_blocked.task_status.label == "Todo"

      task_done = Repo.reload(ctx.task_done)
      assert task_done.task_status.id == "done"
      assert task_done.task_status.label == "Done"
    end

    test "it can add a new status and use it as a replacement for a deleted status", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      old_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "in_review", label: "In Review", color: "blue", index: 1, value: "in_review", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: true}
      ]

      assert {200, _} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        project_id: Paths.project_id(ctx.project),
        task_statuses: old_statuses
      })

      project = Repo.reload(ctx.project)
      in_review_status = Enum.find(project.task_statuses, & &1.id == "in_review")

      ctx = Factory.add_project_task(ctx, :task_in_review, :milestone, [
        name: "Task in review",
        task_status: Map.from_struct(in_review_status)
      ])

      task_in_review = Repo.reload(ctx.task_in_review)
      assert task_in_review.task_status.id == "in_review"

      # Add a brand new status ("triage") and delete "in_review".
      new_statuses = [
        %{id: "todo", label: "Todo", color: "gray", index: 0, value: "todo", closed: false},
        %{id: "triage", label: "Triage", color: "red", index: 1, value: "triage", closed: false},
        %{id: "done", label: "Done", color: "green", index: 2, value: "done", closed: true}
      ]

      assert {200, res} = mutation(ctx.conn, [:projects, :update_task_statuses], %{
        project_id: Paths.project_id(ctx.project),
        task_statuses: new_statuses,
        deleted_status_replacements: [
          %{deleted_status_id: "in_review", replacement_status_id: "triage"}
        ]
      })

      assert res.success == true

      project = Repo.reload(ctx.project)
      assert Enum.any?(project.task_statuses, &(&1.id == "triage"))

      task_in_review = Repo.reload(ctx.task_in_review)
      assert task_in_review.task_status.id == "triage"
      assert task_in_review.task_status.label == "Triage"
    end
  end

  describe "update champion" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_champion], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_champion], %{champion_id: ctx.new_champion.id})
      assert res.message == "Missing required fields: project_id"
    end

    test "it updates the champion", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })
      assert res.success == true

      project = Repo.reload(ctx.project) |> Repo.preload(:champion)
      assert project.champion.id == ctx.new_champion.id
    end

    test "it creates a subscription when a champion is set", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      project = Repo.reload(ctx.project)
      subscription_list_id = project.subscription_list_id
      champion_person_id = ctx.new_champion.id

      assert {:error, :not_found} =
        Operately.Notifications.Subscription.get(:system,
          subscription_list_id: subscription_list_id,
          person_id: champion_person_id
        )

      assert {200, _} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })

      {:ok, subscription} =
        Operately.Notifications.Subscription.get(:system,
          subscription_list_id: subscription_list_id,
          person_id: champion_person_id
        )

      assert subscription.type == :invited
      refute subscription.canceled
    end

    test "it reactivates an existing champion subscription", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      subscription_list_id = ctx.project.subscription_list_id
      champion_person_id = ctx.new_champion.id

      assert {200, _} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })

      {:ok, subscription} =
        Operately.Notifications.Subscription.get(:system,
          subscription_list_id: subscription_list_id,
          person_id: champion_person_id
        )

      {:ok, canceled_subscription} = Operately.Notifications.update_subscription(subscription, %{canceled: true})
      assert canceled_subscription.canceled

      assert {200, _} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })

      {:ok, reactivated_subscription} =
        Operately.Notifications.Subscription.get(:system,
          subscription_list_id: subscription_list_id,
          person_id: champion_person_id
        )

      assert reactivated_subscription.id == subscription.id
      refute reactivated_subscription.canceled
    end

    test "it can update the champion to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First set a champion
      assert {200, _} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })

      # Then remove the champion
      assert {200, res} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: nil
      })
      assert res.success == true

      project = Repo.reload(ctx.project) |> Repo.preload(:champion)
      assert project.champion == nil
    end

    test "it creates an activity when champion is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "project_champion_updating")

      assert {200, _} = mutation(ctx.conn, [:projects, :update_champion], %{
        project_id: Paths.project_id(ctx.project),
        champion_id: Paths.person_id(ctx.new_champion)
      })

      after_count = count_activities(ctx.project.id, "project_champion_updating")
      assert after_count == before_count + 1
    end
  end

  describe "update parent goal" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_parent_goal], %{})
    end

    test "it requires edit permission", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:user)
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.log_in_person(:user)

      assert {403, _} = mutation(ctx.conn, [:projects, :update_parent_goal], %{
        project_id: Paths.project_id(ctx.project),
        goal_id: Ecto.UUID.generate(),
        goal_name: ""
      })
    end

    test "it sets the parent goal", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:parent_goal, :engineering)
        |> Factory.log_in_person(:creator)

      assert {200, %{success: true}} = mutation(ctx.conn, [:projects, :update_parent_goal], %{
        project_id: Paths.project_id(ctx.project),
        goal_id: Paths.goal_id(ctx.parent_goal),
        goal_name: ctx.parent_goal.name
      })

      updated_project = Repo.reload(ctx.project)
      assert updated_project.goal_id == ctx.parent_goal.id
    end

    test "it clears the parent goal when goal_id is null", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:parent_goal, :engineering)
        |> Factory.add_project(:project2, :engineering, goal: :parent_goal)
        |> Factory.log_in_person(:creator)

      assert ctx.project2.goal_id == ctx.parent_goal.id

      assert {200, %{success: true}} = mutation(ctx.conn, [:projects, :update_parent_goal], %{
        project_id: Paths.project_id(ctx.project2),
        goal_id: nil,
        goal_name: nil
      })

      updated_project = Repo.reload(ctx.project2)
      assert updated_project.goal_id == nil
    end

    test "it creates an activity", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:parent_goal1, :engineering, name: "Parent Goal 1")
        |> Factory.add_goal(:parent_goal2, :engineering, name: "Parent Goal 2")
        |> Factory.add_project(:project1, :engineering, goal: :parent_goal1)
        |> Factory.log_in_person(:creator)

      assert {200, %{success: true}} = mutation(ctx.conn, [:projects, :update_parent_goal], %{
        project_id: Paths.project_id(ctx.project1),
        goal_id: Paths.goal_id(ctx.parent_goal2),
        goal_name: ctx.parent_goal2.name
      })

      count = count_activities(ctx.project1.id, "project_goal_connection")
      assert count == 1

      activity = get_activity(ctx.project1.id, "project_goal_connection")

      assert activity.content["project_id"] == ctx.project1.id
      assert activity.content["goal_id"] == ctx.parent_goal2.id
      assert activity.content["goal_name"] == "Parent Goal 2"
      assert activity.content["previous_goal_id"] == ctx.parent_goal1.id
      assert activity.content["previous_goal_name"] == "Parent Goal 1"
    end
  end

  describe "parent goal search" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:projects, :parent_goal_search], %{})
    end

    test "it requires view permission", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:user)
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.log_in_person(:user)


      assert {404, _} = query(ctx.conn, [:projects, :parent_goal_search], %{
        project_id: Paths.project_id(ctx.project),
        query: "test"
      })
    end

    test "it returns goals matching the search query", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal1, :engineering, name: "Test Goal One")
        |> Factory.add_goal(:goal2, :engineering, name: "Test Goal Two")
        |> Factory.add_goal(:goal3, :engineering, name: "Another Goal")
        |> Factory.log_in_person(:creator)

      assert {200, %{goals: goals}} = query(ctx.conn, [:projects, :parent_goal_search], %{
        project_id: Paths.project_id(ctx.project),
        query: "test"
      })

      goal_ids = Enum.map(goals, & &1.id)

      assert Paths.goal_id(ctx.goal1) in goal_ids
      assert Paths.goal_id(ctx.goal2) in goal_ids
      refute Paths.goal_id(ctx.goal3) in goal_ids
    end

    test "it excludes the project's current goal if it exists", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal1, :engineering, name: "Test Goal")
        |> Factory.add_goal(:goal2, :engineering, name: "Test Goal")
        |> Factory.add_project(:another_project, :engineering, goal: :goal1)
        |> Factory.log_in_person(:creator)

      assert {200, %{goals: goals}} = query(ctx.conn, [:projects, :parent_goal_search], %{
        project_id: Paths.project_id(ctx.another_project),
        query: "test"
      })

      goal_ids = Enum.map(goals, & &1.id)

      refute Paths.goal_id(ctx.goal1) in goal_ids
      assert Paths.goal_id(ctx.goal2) in goal_ids
    end
  end

  describe "update reviewer" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_reviewer], %{reviewer_id: ctx.new_champion.id})
      assert res.message == "Missing required fields: project_id"
    end

    test "it updates the reviewer", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(ctx.project),
        reviewer_id: Paths.person_id(ctx.new_champion)
      })
      assert res.success == true

      project = Repo.reload(ctx.project) |> Repo.preload(:reviewer)
      assert project.reviewer.id == ctx.new_champion.id
    end

    test "it creates a subscription when a reviewer is set", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      subscription_list_id = ctx.project.subscription_list_id
      reviewer_person_id = ctx.new_champion.id

      assert {:error, :not_found} =
        Operately.Notifications.Subscription.get(:system,
          subscription_list_id: subscription_list_id,
          person_id: reviewer_person_id
        )

      assert {200, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(ctx.project),
        reviewer_id: Paths.person_id(ctx.new_champion)
      })

      {:ok, subscription} =
        Operately.Notifications.Subscription.get(:system,
          subscription_list_id: subscription_list_id,
          person_id: reviewer_person_id
        )

      assert subscription.type == :invited
      refute subscription.canceled
    end

    test "it reactivates an existing reviewer subscription", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      subscription_list_id = ctx.project.subscription_list_id
      reviewer_person_id = ctx.new_champion.id

      assert {200, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(ctx.project),
        reviewer_id: Paths.person_id(ctx.new_champion)
      })

      {:ok, subscription} =
        Operately.Notifications.Subscription.get(:system,
          subscription_list_id: subscription_list_id,
          person_id: reviewer_person_id
        )

      {:ok, canceled_subscription} = Operately.Notifications.update_subscription(subscription, %{canceled: true})
      assert canceled_subscription.canceled

      assert {200, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(ctx.project),
        reviewer_id: Paths.person_id(ctx.new_champion)
      })

      {:ok, reactivated_subscription} =
        Operately.Notifications.Subscription.get(:system,
          subscription_list_id: subscription_list_id,
          person_id: reviewer_person_id
        )

      assert reactivated_subscription.id == subscription.id
      refute reactivated_subscription.canceled
    end

    test "it can update the reviewer to nil", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First set a reviewer
      assert {200, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(ctx.project),
        reviewer_id: Paths.person_id(ctx.new_champion)
      })

      # Then remove the reviewer
      assert {200, res} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(ctx.project),
        reviewer_id: nil
      })
      assert res.success == true

      project = Repo.reload(ctx.project) |> Repo.preload(:reviewer)
      assert project.reviewer == nil
    end

    test "it creates an activity when reviewer is updated", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      before_count = count_activities(ctx.project.id, "project_reviewer_updating")

      assert {200, _} = mutation(ctx.conn, [:projects, :update_reviewer], %{
        project_id: Paths.project_id(ctx.project),
        reviewer_id: Paths.person_id(ctx.new_champion)
      })

      after_count = count_activities(ctx.project.id, "project_reviewer_updating")
      assert after_count == before_count + 1
    end
  end

  describe "create milestone" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :create_milestone], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :create_milestone], %{name: "Release v1.0", due_date: %{date: "2026-01-01", date_type: "day", value: "Jan 1, 2026"}})
      assert res.message == "Missing required fields: project_id"
    end

    test "it requires a name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :create_milestone], %{project_id: Paths.project_id(ctx.project), due_date: %{date: "2026-01-01", date_type: "day", value: "Jan 1, 2026"}})
      assert res.message == "Missing required fields: name"
    end

    test "it creates a milestone", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      project_before = Repo.reload(ctx.project)
      assert project_before.milestones_ordering_state == [Paths.milestone_id(ctx.milestone)]

      assert {200, res} = mutation(ctx.conn, [:projects, :create_milestone], %{
        project_id: Paths.project_id(ctx.project),
        name: "Release v1.0",
        due_date: nil
      })
      assert res.milestone.title == "Release v1.0"

      milestone = Operately.Projects.get_milestone_by_name(ctx.project, "Release v1.0")

      assert milestone.title == "Release v1.0"
      assert milestone.project_id == ctx.project.id

      project_after = Repo.reload(project_before)
      assert project_after.milestones_ordering_state == [Paths.milestone_id(ctx.milestone), res.milestone.id]
    end

    test "it creates a milestone with a date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :create_milestone], %{
        project_id: Paths.project_id(ctx.project),
        name: "Release v1.0",
        due_date: contextual_date
      })

      assert res.milestone.title == "Release v1.0"

      milestone = Operately.Projects.get_milestone_by_name(ctx.project, "Release v1.0")

      assert milestone.title == "Release v1.0"
      assert milestone.project_id == ctx.project.id
      assert Timeframe.end_date(milestone.timeframe) == ~D[2026-01-01]
    end

    test "it creates an activity when a milestone is created", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      action = "project_milestone_creation"
      before_count = count_activities(ctx.project.id, action)

      assert {200, res} = mutation(ctx.conn, [:projects, :create_milestone], %{
        project_id: Paths.project_id(ctx.project),
        name: "Release activity",
        due_date: nil
      })

      after_count = count_activities(ctx.project.id, action)
      assert after_count == before_count + 1

      activity = get_activity(ctx.project.id, action)
      {:ok, milestone_id} = OperatelyWeb.Api.Helpers.decode_id(res.milestone.id)

      assert activity.content["project_id"] == ctx.project.id
      assert activity.content["milestone_id"] == milestone_id
      assert activity.content["milestone_name"] == "Release activity"
    end

    test "it notifies project subscribers when a milestone is created", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:subscriber, :project, :as_person)
        |> Factory.log_in_person(:creator)

      action = "project_milestone_creation"

      assert notifications_count(action: action) == 0

      assert {200, res} = mutation(ctx.conn, [:projects, :create_milestone], %{
        project_id: Paths.project_id(ctx.project),
        name: "Release notify",
        due_date: nil
      })

      activity = get_activity(ctx.project.id, action)
      {:ok, milestone_id} = OperatelyWeb.Api.Helpers.decode_id(res.milestone.id)
      assert activity.content["milestone_id"] == milestone_id

      notifications = fetch_notifications(activity.id, action: action)
      refute notifications == []
      assert Enum.any?(notifications, &(&1.person_id == ctx.subscriber.id))
      refute Enum.any?(notifications, &(&1.person_id == ctx.creator.id))
    end
  end

  describe "update milestone" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_milestone], %{})
    end

    test "it requires a milestone_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_milestone], %{name: "Updated Release", project_id: Paths.project_id(ctx.project), due_date: nil})
      assert res.message == "Missing required fields: milestone_id"
    end

    test "it updates a milestone's name", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First create a milestone
      milestone = Operately.ProjectsFixtures.milestone_fixture(%{
        project_id: ctx.project.id,
        name: "Release v1.0",
      })

      assert {200, res} = mutation(ctx.conn, [:projects, :update_milestone], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(milestone),
        name: "Updated Release",
        due_date: nil,
      })

      assert res.milestone.title == "Updated Release"

      updated_milestone = Repo.reload(milestone)
      assert updated_milestone.title == "Updated Release"
    end

    test "it updates a milestone's date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # First create a milestone with no date
      milestone = Operately.ProjectsFixtures.milestone_fixture(%{
        project_id: ctx.project.id,
        name: "Release v1.0",
      })

      contextual_date = %{
        date: "2026-01-01",
        date_type: "day",
        value: "Jan 1, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :update_milestone], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(milestone),
        name: "Release v1.0",
        due_date: contextual_date
      })

      assert res.milestone.timeframe.contextual_end_date == contextual_date

      updated_milestone = Repo.reload(milestone)
      assert Timeframe.end_date(updated_milestone.timeframe) == ~D[2026-01-01]
    end

    test "it updates both name and date", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      milestone = Operately.ProjectsFixtures.milestone_fixture(%{
        project_id: ctx.project.id,
        timeframe: %{
          contextual_start_date: nil,
          contextual_end_date: ContextualDate.create_day_date(~D[2025-12-31]),
        }
      })

      new_contextual_date = %{
        date: "2026-03-15",
        date_type: "day",
        value: "Mar 15, 2026"
      }

      assert {200, res} = mutation(ctx.conn, [:projects, :update_milestone], %{
        project_id: Paths.project_id(ctx.project),
        milestone_id: Paths.milestone_id(milestone),
        name: "Release v2.0",
        due_date: new_contextual_date
      })

      assert res.milestone.title == "Release v2.0"
      assert res.milestone.timeframe.contextual_end_date == new_contextual_date

      updated_milestone = Repo.reload(milestone)
      assert updated_milestone.title == "Release v2.0"
      assert Timeframe.end_date(updated_milestone.timeframe) == ~D[2026-03-15]
    end
  end

  describe "update tasks kanban state" do
    test "it updates project tasks_kanban_state and only creates activity when task status changes", ctx do
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

      assert {200, res1} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.task),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state)
      })

      assert res1.project.id == Paths.project_id(ctx.project)
      assert res1.task.id == Paths.task_id(ctx.task)

      project = Repo.reload(ctx.project)
      assert project.tasks_kanban_state["in_progress"] == kanban_state.in_progress
      assert count_task_activities(ctx.task, "task_status_updating") == before_count + 1

      assert {200, _res2} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
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

      assert {200, _} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.task1),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state_1)
      })

      assert count_task_activities(ctx.task1, "task_status_updating") == before_count + 1

      assert {200, _} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.task1),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state_2)
      })

      project = Repo.reload(ctx.project)
      assert project.tasks_kanban_state["in_progress"] == kanban_state_2.in_progress
      assert count_task_activities(ctx.task1, "task_status_updating") == before_count + 1
    end

    test "it doesn't work when the task doesn't belong to the project", ctx do
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

      assert ctx.foreign_task.project_id != ctx.project.id

      assert {404, _} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.foreign_task),
        status: status_input,
        kanban_state: Jason.encode!(kanban_state)
      })
    end

    test "it requires authentication", ctx do
      status = %{id: Ecto.UUID.generate(), label: "", color: "blue", index: 0, value: "", closed: false}
      assert {401, _} = mutation(ctx.conn, [:projects, :update_kanban], %{status: status, kanban_state: Jason.encode!(%{})})
    end

    test "it requires a project_id", ctx do
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

      assert {400, res} = mutation(ctx.conn, [:projects, :update_kanban], %{
        task_id: Paths.task_id(ctx.task),
        status: status_input,
        kanban_state: Jason.encode!(%{})
      })

      assert res.message == "Missing required fields: project_id"
    end

    test "it requires a task_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      status_input =
        Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        status: status_input,
        kanban_state: Jason.encode!(%{})
      })

      assert res.message == "Missing required fields: task_id"
    end

    test "it requires a status", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.task),
        kanban_state: Jason.encode!(%{})
      })

      assert res.message == "Missing required fields: status"
    end

    test "it requires a kanban_state", ctx do
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

      assert {400, res} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.task),
        status: status_input
      })

      assert res.message == "Missing required fields: kanban_state"
    end

    test "it returns 404 when the person doesn't have read access to the project", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      status = %{id: Ecto.UUID.generate(), label: "", color: "blue", index: 0, value: "", closed: false}

      assert {404, _} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.task),
        status: status,
        kanban_state: Jason.encode!(%{})
      })
    end

    test "it returns 404 when project_id is invalid", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      status = %{id: Ecto.UUID.generate(), label: "", color: "blue", index: 0, value: "", closed: false}

      assert {404, _} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Ecto.UUID.generate(),
        task_id: Paths.task_id(ctx.task),
        status: status,
        kanban_state: Jason.encode!(%{})
      })
    end

    test "it returns 404 when task_id is invalid", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      status = %{id: Ecto.UUID.generate(), label: "", color: "blue", index: 0, value: "", closed: false}

      assert {404, _} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Ecto.UUID.generate(),
        status: status,
        kanban_state: Jason.encode!(%{})
      })
    end

    test "it returns 403 when the person doesn't have edit access to the project", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:space_member)

      status_input =
        Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "in_progress" end)
        |> then(fn status ->
          status
          |> Map.from_struct()
          |> Map.put(:color, to_string(status.color))
        end)

      assert {403, _} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.task),
        status: status_input,
        kanban_state: Jason.encode!(%{})
      })
    end

    test "it rejects a status that doesn't belong to the project", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.log_in_person(:creator)

      kanban_state = %{
        pending: [],
        in_progress: [Paths.task_id(ctx.task)],
        done: [],
        canceled: []
      }

      invalid_status = %{
        id: Ecto.UUID.generate(),
        label: "Invalid",
        color: "blue",
        index: 99,
        value: "invalid",
        closed: false
      }

      assert {400, res} = mutation(ctx.conn, [:projects, :update_kanban], %{
        project_id: Paths.project_id(ctx.project),
        task_id: Paths.task_id(ctx.task),
        status: invalid_status,
        kanban_state: Jason.encode!(kanban_state)
      })

      assert res.message == "Invalid status"
    end
  end

  describe "delete project" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :delete], %{})
    end

    test "it requires a project_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, res} = mutation(ctx.conn, [:projects, :delete], %{})
      assert res.message == "Missing required fields: project_id"
    end

    test "it returns not found for non-existent project", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:projects, :delete], %{
        project_id: Ecto.UUID.generate()
      })
    end

    test "it returns forbidden for non-space-members", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :view_access)
        |> Factory.add_company_member(:member)
        |> Factory.log_in_person(:member)

      assert {403, _} = mutation(ctx.conn, [:projects, :delete], %{
        project_id: Paths.project_id(ctx.project)
      })
    end

    test "it returns forbidden for space members without permission", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :view_access)
        |> Factory.add_space_member(:space_member, :engineering)
        |> Factory.log_in_person(:space_member)

      assert {403, _} = mutation(ctx.conn, [:projects, :delete], %{
        project_id: Paths.project_id(ctx.project)
      })
    end

    test "it deletes the project when user has permission", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = mutation(ctx.conn, [:projects, :delete], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert res.project.id == Paths.project_id(ctx.project)
      assert_raise Ecto.NoResultsError, fn ->
        Operately.Projects.get_project!(ctx.project.id)
      end
    end

    test "it allows reviewer to delete the project", ctx do
      ctx =
        ctx
        |> Factory.add_project_reviewer(:reviewer, :project, :as_person)
        |> Factory.log_in_person(:reviewer)

      assert {200, res} = mutation(ctx.conn, [:projects, :delete], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert res.project.id == Paths.project_id(ctx.project)
      assert_raise Ecto.NoResultsError, fn ->
        Operately.Projects.get_project!(ctx.project.id)
      end
    end

    test "it deletes projects with resources", ctx do
      ctx =
        ctx
        |> Factory.add_project_contributor(:contrib, :project)
        |> Factory.add_project_milestone(:milestone, :project)
        |> Factory.add_project_retrospective(:retrospective, :project, :creator)
        |> Factory.add_project_check_in(:check_in, :project, :creator)
        |> Factory.add_project_discussion(:discussion, :project)
        |> Factory.log_in_person(:creator)

      assert count_activities(project_id: ctx.project.id) > 0
      assert Operately.Projects.get_check_in!(ctx.check_in.id)
      assert Operately.Projects.get_milestone!(ctx.milestone.id)
      assert Operately.Projects.get_retrospective!(ctx.retrospective.id)
      assert Operately.Comments.get_thread!(ctx.discussion.id)
      assert Operately.Projects.get_contributor!(ctx.contrib.id)

      assert {200, res} = mutation(ctx.conn, [:projects, :delete], %{
        project_id: Paths.project_id(ctx.project)
      })

      assert res.project.id == Paths.project_id(ctx.project)
      assert_raise Ecto.NoResultsError, fn ->
        Operately.Projects.get_project!(ctx.project.id)
      end

      # activities are deleted
      assert count_activities(project_id: ctx.project.id) == 0

      # resources are deleted
      assert_raise Ecto.NoResultsError, fn ->
        Operately.Projects.get_check_in!(ctx.check_in.id)
      end
      assert_raise Ecto.NoResultsError, fn ->
        Operately.Projects.get_milestone!(ctx.milestone.id)
      end
      assert_raise Ecto.NoResultsError, fn ->
        Operately.Projects.get_retrospective!(ctx.retrospective.id)
      end
      assert_raise Ecto.NoResultsError, fn ->
        Operately.Comments.get_thread!(ctx.discussion.id)
      end
      assert_raise Ecto.NoResultsError, fn ->
        Operately.Projects.get_contributor!(ctx.contrib.id)
      end
    end
  end

  #
  # Utility functions
  #

  import Ecto.Query, only: [from: 2]

  defp count_activities(project_id, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["project_id"] == ^project_id
    )
    |> Repo.aggregate(:count)
  end

  defp count_task_activities(task, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["task_id"] == ^task.id
    )
    |> Repo.aggregate(:count)
  end

  defp count_activities(project_id: project_id) do
    from(a in Operately.Activities.Activity,
      where: a.content["project_id"] == ^project_id
    )
    |> Repo.aggregate(:count)
  end

  defp get_activity(project_id, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["project_id"] == ^project_id
    )
    |> Repo.one()
  end
end
