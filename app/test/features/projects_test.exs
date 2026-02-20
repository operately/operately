defmodule Operately.Features.ProjectsTest do
  import ExUnit.Callbacks, only: [on_exit: 1]
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectSteps, as: Steps
  alias Operately.Support.Features.ReviewSteps

  describe "project page" do
    setup ctx do
      ctx
      |> Steps.create_project(name: "Test Project")
      |> Steps.setup_contributors()
      |> Steps.login()
    end

    @tag login_as: :contributor
    feature "rename a project", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
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

    @tag login_as: :contributor
    feature "pausing a project", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.pause_project()
      |> Steps.assert_project_paused()
      |> Steps.assert_pause_notification_sent_to_reviewer()
      |> Steps.assert_pause_visible_on_feed()
      |> Steps.assert_pause_email_sent_to_reviewer()
    end

    @tag login_as: :contributor
    feature "resuming a project", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
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
    feature "resuming a paused project clears overdue check-ins", ctx do
      ctx
      |> Steps.given_project_check_in_is_overdue()
      |> ReviewSteps.visit_review_page()
      |> ReviewSteps.assert_the_due_project_is_listed()
      |> Steps.visit_project_page()
      |> Steps.pause_project()
      |> Steps.resume_project()
      |> ReviewSteps.assert_the_checked_in_project_is_no_longer_displayed()
      |> Steps.assert_next_check_in_scheduled_at_is_next_friday()
    end

    @tag login_as: :commenter
    feature "comment on project resumption", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_comment_access()
      |> Steps.visit_project_page()
      |> Steps.given_project_is_paused()
      |> Steps.given_project_is_resumed()
      |> Steps.leave_comment_on_project_resumption()
      |> Steps.assert_comment_on_resumption_visible_on_feed()
      |> Steps.assert_comment_on_resumption_received_in_notifications()
      |> Steps.assert_comment_on_resumption_received_in_email()
    end

    @tag login_as: :contributor
    feature "connect a goal to a project", ctx do
      goal_name = "Improve support first response time"

      ctx
      |> Steps.given_a_goal_exists(name: goal_name)
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.choose_new_goal(goal_name: goal_name)
      |> Steps.assert_goal_connected(goal_name: goal_name)
      |> Steps.assert_goal_link_on_project_page(goal_name: goal_name)
      |> Steps.assert_project_goal_connection_visible_on_feed(goal_name: goal_name)
      |> Steps.assert_goal_connected_email_sent_to_champion(goal_name: goal_name)
    end

    @tag login_as: :contributor
    feature "edit project start date", ctx do
      next_friday = Operately.Support.Time.next_friday()
      formatted_date = Operately.Support.Time.format_month_day(next_friday)
      formatted_date_in_feed = Operately.Support.Time.format_month_day_maybe_year(next_friday)

      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.edit_project_start_date(next_friday)
      |> Steps.assert_project_start_date(formatted_date)
      |> Steps.reload_project_page()
      |> Steps.assert_project_start_date(formatted_date)
      |> Steps.assert_project_start_date_change_visible_in_feed(formatted_date_in_feed)
    end

    @tag login_as: :contributor
    feature "edit project due date", ctx do
      next_friday = Operately.Support.Time.next_friday()
      formatted_date = Operately.Support.Time.format_month_day(next_friday)
      formatted_date_in_feed = Operately.Support.Time.format_month_day_maybe_year(next_friday)

      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.edit_project_due_date(next_friday)
      |> Steps.assert_project_due_date(formatted_date)
      |> Steps.reload_project_page()
      |> Steps.assert_project_due_date(formatted_date)
      |> Steps.assert_project_due_date_change_visible_in_feed(formatted_date_in_feed)
      |> Steps.assert_project_due_date_notification_sent(formatted_date_in_feed)
      |> Steps.assert_project_due_date_set_email_sent()
    end

    @tag login_as: :contributor
    feature "edit project due date sends notification to champion", ctx do
      next_friday = Operately.Support.Time.next_friday()
      formatted_date = Operately.Support.Time.format_month_day(next_friday)

      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.edit_project_due_date(next_friday)
      |> Steps.assert_project_due_date(formatted_date)
      |> Steps.assert_project_due_date_changed_notification_sent(formatted_date)
      |> Steps.assert_project_due_date_changed_email_sent()
    end

    @tag login_as: :contributor
    feature "remove project due date sends notification to champion", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.given_project_due_date_exists()
      |> Steps.visit_project_page()
      |> Steps.remove_project_due_date()
      |> Steps.assert_no_project_due_date()
      |> Steps.assert_project_due_date_removed_notification_sent()
      |> Steps.assert_project_due_date_removed_email_sent()
    end

    @tag login_as: :contributor
    feature "overdue project shows overdue message", ctx do
      three_days_ago = Date.utc_today() |> Date.add(-3)
      fifteen_days_ago = Date.utc_today() |> Date.add(-15)

      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.edit_project_due_date(three_days_ago)
      |> Steps.assert_project_overdue_message("Overdue by 3 days")
      |> Steps.edit_project_due_date(fifteen_days_ago)
      |> Steps.assert_project_overdue_message("Overdue by 2 weeks")
    end

    @tag login_as: :viewer
    feature "export project as markdown", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_view_access()
      |> Steps.visit_project_page()
      |> Steps.download_project_markdown()
      |> Steps.assert_project_markdown_includes_details()
    end
  end

  describe "project page preload access" do
    setup ctx do
      ctx = Steps.create_project(ctx, name: "Test Project")
      ctx = Steps.login(ctx)

      {:ok, ctx}
    end

    @tag login_as: :reviewer
    feature "project page hides parent goal when viewer cannot access it", ctx do
      ctx
      |> Steps.given_a_goal_exists(name: "Hidden Goal")
      |> Steps.given_the_goal_is_connected_with_project()
      |> Steps.assert_project_has_parent_goal()
      |> Steps.given_goal_is_not_accessible_to_company_members()
      |> Steps.given_space_member_exists()
      |> Steps.login_as_space_member()
      |> Steps.visit_project_page()
      |> Steps.assert_project_page_loaded()
      |> Steps.assert_parent_goal_field_not_rendered()
    end

    @tag login_as: :reviewer
    feature "project page hides space navigation when space is not accessible", ctx do
      ctx
      |> Steps.given_company_members_cannot_access_space()
      |> Steps.visit_project_page()
      |> Steps.assert_project_navigation_without_space()
      |> Steps.assert_move_to_another_space_is_hidden()
    end
  end

  describe "new project page" do
    setup ctx do
      ctx
      |> Steps.setup()
      |> Steps.setup_contributors()
    end

    feature "changing project name", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.change_project_name()
      |> Steps.assert_project_name_changed()
      |> Steps.assert_project_name_changed_feed_posted()
    end

    feature "changing the champion", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.change_champion(name: ctx.champion.full_name)
      |> Steps.assert_champion_changed(name: ctx.champion.full_name)
      |> Steps.assert_champion_changed_feed_posted(champion: ctx.champion)
    end

    feature "changing the champion sends notification to subscribers", ctx do
      ctx
      |> Steps.given_subscriber_exists()
      |> Steps.log_in_as_subscriber()
      |> Steps.visit_project_page()
      |> Steps.subscribe_to_project()
      |> Steps.log_in_as_creator()
      |> Steps.visit_project_page()
      |> Steps.change_champion(name: ctx.champion.full_name)
      |> Steps.assert_champion_change_notification_sent_to_subscriber()
      |> Steps.assert_champion_change_email_sent_to_subscriber()
    end

    feature "removing the champion", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.remove_champion()
      |> Steps.assert_champion_removed()
      |> Steps.assert_champion_removed_feed_posted()
    end

    feature "removing the champion sends notification to subscribers", ctx do
      ctx
      |> Steps.given_subscriber_exists()
      |> Steps.log_in_as_subscriber()
      |> Steps.visit_project_page()
      |> Steps.subscribe_to_project()
      |> Steps.log_in_as_creator()
      |> Steps.visit_project_page()
      |> Steps.remove_champion()
      |> Steps.assert_champion_removed_notification_sent_to_subscriber()
      |> Steps.assert_champion_removed_email_sent_to_subscriber()
    end

    feature "changing the reviewer", ctx do
      ctx
      |> Steps.given_project_with_reviewer_exists()
      |> Steps.visit_project_page()
      |> Steps.change_reviewer(name: ctx.reviewer.full_name)
      |> Steps.assert_reviewer_changed(name: ctx.reviewer.full_name)
      |> Steps.assert_reviewer_changed_feed_posted(reviewer: ctx.reviewer)
    end

    feature "changing the reviewer sends notification to subscribers", ctx do
      ctx
      |> Steps.given_project_with_reviewer_exists()
      |> Steps.given_subscriber_exists()
      |> Steps.log_in_as_subscriber()
      |> Steps.visit_project_page()
      |> Steps.subscribe_to_project()
      |> Steps.log_in_as_creator()
      |> Steps.visit_project_page()
      |> Steps.change_reviewer(name: ctx.reviewer.full_name)
      |> Steps.assert_reviewer_change_notification_sent_to_subscriber()
      |> Steps.assert_reviewer_change_email_sent_to_subscriber()
    end

    feature "removing the reviewer", ctx do
      ctx
      |> Steps.given_project_with_reviewer_exists()
      |> Steps.visit_project_page()
      |> Steps.remove_reviewer()
      |> Steps.assert_reviewer_removed()
      |> Steps.assert_reviewer_removed_feed_posted()
    end

    feature "removing the reviewer sends notification to subscribers", ctx do
      ctx
      |> Steps.given_project_with_reviewer_exists()
      |> Steps.given_subscriber_exists()
      |> Steps.log_in_as_subscriber()
      |> Steps.visit_project_page()
      |> Steps.subscribe_to_project()
      |> Steps.log_in_as_creator()
      |> Steps.visit_project_page()
      |> Steps.remove_reviewer()
      |> Steps.assert_reviewer_change_notification_sent_to_subscriber()
      |> Steps.assert_reviewer_removed_email_sent_to_subscriber()
    end
  end

  describe "project page permissions" do
    setup ctx, do: Steps.setup(ctx)

    feature "Person with edit access can see correct actions", ctx do
      ctx
      |> Steps.given_project_with_edit_access_member_logged_in()
      |> Steps.assert_member_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.assert_manage_access_visible()
      |> Steps.assert_start_date_editable()
      |> Steps.assert_description_editable()
      |> Steps.assert_pause_and_close_actions_visible()
      |> Steps.assert_add_milestone_visible()
      |> Steps.assert_add_resource_visible()
      |> Steps.assert_add_task_and_milestone_visible_in_tasks_tab()
      |> Steps.assert_add_task_visible_in_kanban_view()
      |> Steps.assert_add_check_in_visible()
      |> Steps.assert_add_dicussion_visible()
    end

    feature "Person with comment access can see correct actions", ctx do
      ctx
      |> Steps.given_project_with_comment_access_member_logged_in()
      |> Steps.assert_member_has_comment_access()
      |> Steps.visit_project_page()
      |> Steps.refute_description_editable()
      |> Steps.refute_pause_and_close_actions_visible()
      |> Steps.refute_manage_access_visible()
      |> Steps.refute_add_milestone_visible()
      |> Steps.refute_add_resource_visible()
      |> Steps.refute_add_task_and_milestone_visible_in_tasks_tab()
      |> Steps.refute_add_task_visible_in_kanban_view()
      |> Steps.refute_add_check_in_visible()
      |> Steps.refute_add_dicussion_visible()
    end
  end

  describe "ai sidebar" do
    setup ctx do
      ctx =
        ctx
        |> Steps.create_project(name: "AI Project")
        |> Steps.login()

      previous = Application.get_env(:operately, :ai_configured)
      Application.put_env(:operately, :ai_configured, false)

      on_exit(fn ->
        Application.put_env(:operately, :ai_configured, previous)
      end)

      {:ok, ctx}
    end

    @tag login_as: :champion
    feature "shows a message when ai isn't configured", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.open_ai_sidebar()
      |> Steps.assert_ai_sidebar_disabled_message(
        message: "Ask Alfred isn't available because the AI integration hasn't been configured."
      )
    end
  end
end
