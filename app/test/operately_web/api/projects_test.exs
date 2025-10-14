defmodule OperatelyWeb.Api.ProjectsTest do
  alias Operately.ContextualDates.{Timeframe, ContextualDate}

  use OperatelyWeb.TurboCase

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
