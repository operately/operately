defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  describe "old project page" do
    alias Operately.Support.Features.ProjectSteps, as: Steps

    setup ctx do
      ctx = Steps.create_project(ctx, name: "Test Project")
      ctx = Steps.login(ctx)

      {:ok, ctx}
    end

    @tag login_as: :champion
    feature "rename a project", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.rename_project(new_name: "New Name")
      |> Steps.assert_project_renamed(new_name: "New Name")
      |> Steps.assert_project_renamed_visible_on_feed()
    end

    @tag login_as: :champion
    feature "move project to a different space", ctx do
      ctx
      |> Steps.given_a_space_exists(%{name: "New Space"})
      |> Steps.visit_project_page()
      |> Steps.move_project_to_new_space()
      |> Steps.assert_project_moved_notification_sent()
      |> Steps.assert_project_moved_feed_item_exists()
    end

    @tag login_as: :champion
    feature "pausing a project", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.pause_project()
      |> Steps.assert_project_paused()
      |> Steps.assert_pause_notification_sent_to_reviewer()
      |> Steps.assert_pause_visible_on_feed()
      |> Steps.assert_pause_email_sent_to_reviewer()
    end

    @tag login_as: :champion
    feature "resuming a project", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.pause_project()
      |> Steps.assert_project_paused()
      |> Steps.resume_project()
      |> Steps.assert_project_active()
      |> Steps.assert_resume_notification_sent_to_reviewer()
      |> Steps.assert_project_resumed_visible_on_feed()
      |> Steps.assert_resume_email_sent_to_reviewer()
    end

    @tag login_as: :champion
    feature "connect a goal to a project", ctx do
      goal_name = "Improve support first response time"

      ctx
      |> Steps.given_a_goal_exists(name: goal_name)
      |> Steps.visit_project_page()
      |> Steps.choose_new_goal(goal_name: goal_name)
      |> Steps.assert_goal_connected(goal_name: goal_name)
      |> Steps.assert_goal_link_on_project_page(goal_name: goal_name)
      |> Steps.assert_project_goal_connection_visible_on_feed(goal_name: goal_name)
      |> Steps.assert_goal_connected_email_sent_to_champion(goal_name: goal_name)
    end
  end

  describe "new project page" do
    alias Operately.Support.Features.ProjectSteps, as: Steps

    setup ctx, do: Steps.setup(ctx)

    feature "changing project name", ctx do
      ctx
      |> UI.visit(Paths.project_path(ctx.company, ctx.project))
      |> Steps.change_project_name()
      |> Steps.assert_project_name_changed()
      |> Steps.assert_project_name_changed_feed_posted()
    end

    # feature "changing the champion", ctx do
    #   ctx
    #   |> Steps.change_champion()
    #   |> Steps.assert_champion_changed()
    #   |> Steps.assert_champion_changed_feed_posted()
    #   |> Steps.assert_champion_changed_email_sent()
    #   |> Steps.assert_champion_changed_notification_sent()
    # end

    # feature "removing the champion", ctx do
    #   ctx
    #   |> Steps.remove_champion()
    #   |> Steps.assert_champion_removed()
    #   |> Steps.assert_champion_removed_feed_posted()
    # end

    # feature "changing the reviewer", ctx do
    #   ctx
    #   |> Steps.change_reviewer()
    #   |> Steps.assert_reviewer_changed()
    #   |> Steps.assert_reviewer_changed_feed_posted()
    #   |> Steps.assert_reviewer_changed_email_sent()
    #   |> Steps.assert_reviewer_changed_notification_sent()
    # end

    # feature "removing the reviewer", ctx do
    #   ctx
    #   |> Steps.remove_reviewer()
    #   |> Steps.assert_reviewer_removed()
    #   |> Steps.assert_reviewer_removed_feed_posted()
    # end
  end
end
