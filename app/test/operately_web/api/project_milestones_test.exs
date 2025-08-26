defmodule OperatelyWeb.Api.ProjectMilestonesTest do
  use OperatelyWeb.TurboCase

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
