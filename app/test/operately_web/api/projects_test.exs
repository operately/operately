defmodule OperatelyWeb.Api.ProjectsTest do
  alias Operately.ContextualDates.Timeframe

  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:engineering)
    |> Factory.add_project(:project, :engineering)
    |> Factory.add_space_member(:new_champion, :engineering)
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

      assert {404, _} = mutation(ctx.conn, [:projects, :update_parent_goal], %{
        project_id: Paths.project_id(ctx.project),
        goal_id: Ecto.UUID.generate()
      })
    end

    test "it sets the parent goal", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:parent_goal, :engineering)
        |> Factory.log_in_person(:creator)

      assert {200, %{success: true}} = mutation(ctx.conn, [:projects, :update_parent_goal], %{
        project_id: Paths.project_id(ctx.project),
        goal_id: Paths.goal_id(ctx.parent_goal)
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
        goal_id: nil
      })

      updated_project = Repo.reload(ctx.project2)
      assert updated_project.goal_id == nil
    end

    test "it creates an activity", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:parent_goal, :engineering)
        |> Factory.log_in_person(:creator)

      # Count activities before
      before_count = count_activities(ctx.project.id, :project_goal_connection)

      assert {200, %{success: true}} = mutation(ctx.conn, [:projects, :update_parent_goal], %{
        project_id: Paths.project_id(ctx.project),
        goal_id: Paths.goal_id(ctx.parent_goal)
      })

      # Count activities after
      after_count = count_activities(ctx.project.id, :project_goal_connection)

      assert after_count == before_count + 1
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

      assert {200, res} = mutation(ctx.conn, [:projects, :create_milestone], %{
        project_id: Paths.project_id(ctx.project),
        name: "Release v1.0",
        due_date: nil
      })
      assert res.milestone.title == "Release v1.0"

      milestone = Operately.Projects.get_milestone_by_name(ctx.project, "Release v1.0")

      assert milestone.title == "Release v1.0"
      assert milestone.project_id == ctx.project.id
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
      {:ok, milestone} = Operately.Projects.create_milestone(%{
        title: "Release v1.0",
        project_id: ctx.project.id
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
      {:ok, milestone} = Operately.Projects.create_milestone(%{
        title: "Release v1.0",
        project_id: ctx.project.id
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

      {:ok, milestone} = Operately.Projects.create_milestone(%{
        title: "Release v1.0",
        project_id: ctx.project.id,
        timeframe: %{
          contextual_start_date: nil,
          contextual_end_date: %{
            date: "2025-12-31",
            date_type: "day",
            value: "Dec 31, 2025"
          }
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

  #
  # Helpers
  #

  defp count_activities(project_id, action) do
    Operately.Activities.Activity
    |> Operately.Repo.all(where: [action: action, resource_id: project_id])
    |> length()
  end
end
