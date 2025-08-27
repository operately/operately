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

    test "it updates the milestone title for space members with edit access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :edit_access)
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
        |> Factory.add_project_contributor(:champion, :project, role: :champion)
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
        |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer)
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

    test "it updates due date for space members with edit access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :edit_access)
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

    test "it updates the milestone description for space members with edit access", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.edit_project_space_members_access(:project, :edit_access)
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
        |> Factory.add_project_contributor(:champion, :project, role: :champion)
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
        |> Factory.add_project_contributor(:reviewer, :project, role: :reviewer)
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

  #
  # Utility functions
  #

  import Ecto.Query, only: [from: 2]

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
