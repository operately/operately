defmodule Operately.Features.ProjectMilestonesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectMilestonesSteps, as: Steps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Live support")
    ctx = UI.login_as(ctx, ctx.champion)

    {:ok, ctx}
  end

  describe "Project page" do
    feature "project timeline zero state", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.assert_project_milestones_zero_state()
    end

    feature "add first milestone", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.add_first_milestone(name: "My milestone")
      |> Steps.assert_add_milestone_form_closed()
      |> Steps.assert_milestone_created(name: "My milestone")
    end

    feature "add milestones to project", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.add_milestone(name: "1st milestone")
      |> Steps.assert_add_milestone_form_closed()
      |> Steps.assert_milestone_created(name: "1st milestone")
      |> Steps.add_milestone(name: "2nd milestone")
      |> Steps.assert_add_milestone_form_closed()
      |> Steps.assert_milestone_created(name: "2nd milestone")
      |> Steps.reload_project_page()
      |> Steps.assert_milestone_created(name: "1st milestone")
      |> Steps.assert_milestone_created(name: "2nd milestone")
    end

    feature "add milestone to project that doesn't have a champion", ctx do
      ctx
      |> Steps.given_that_milestone_project_doesnt_have_champion()
      |> Steps.visit_project_page()
      |> Steps.add_milestone(name: "My milestone")
      |> Steps.assert_add_milestone_form_closed()
      |> Steps.assert_milestone_created(name: "My milestone")
      |> Steps.reload_project_page()
      |> Steps.assert_milestone_created(name: "My milestone")
    end

    feature "add multiple milestone with 'Create more' toggle on", ctx do
      ctx
      |> Steps.visit_project_page()
      |> Steps.add_multiple_milestones(names: ["1st milestone", "2nd milestone", "3rd milestone"])
      |> Steps.assert_add_milestone_form_closed()
      |> Steps.assert_milestone_created(name: "1st milestone")
      |> Steps.assert_milestone_created(name: "2nd milestone")
      |> Steps.assert_milestone_created(name: "3rd milestone")
      |> Steps.reload_project_page()
      |> Steps.assert_milestone_created(name: "1st milestone")
      |> Steps.assert_milestone_created(name: "2nd milestone")
      |> Steps.assert_milestone_created(name: "3rd milestone")
    end

    feature "add milestone with due date", ctx do
      next_friday = Operately.Support.Time.next_friday()
      formatted_date = Operately.Support.Time.format_month_day(next_friday)

      ctx
      |> Steps.visit_project_page()
      |> Steps.add_milestone(name: "My milestone", due_date: next_friday)
      |> Steps.assert_add_milestone_form_closed()
      |> Steps.assert_milestone_created(name: "My milestone", due_date: formatted_date)
      |> Steps.reload_project_page()
      |> Steps.assert_milestone_created(name: "My milestone", due_date: formatted_date)
    end

    feature "edit a milestone from project timeline", ctx do
      next_friday = Operately.Support.Time.next_friday()
      formatted_date = Operately.Support.Time.format_month_day(next_friday)

      ctx
      |> Steps.given_that_a_milestone_exists("My milestone")
      |> Steps.visit_project_page()
      |> Steps.edit_milestone(name: "My milestone", new_name: "Edited milestone", new_due_date: next_friday)
      |> Steps.assert_milestone_updated(name: "Edited milestone", due_date: formatted_date)
      |> Steps.reload_project_page()
      |> Steps.assert_milestone_updated(name: "Edited milestone", due_date: formatted_date)
    end

    feature "add milestone sends notification and email to champion", ctx do
      ctx
      |> UI.login_as(ctx.reviewer)
      |> Steps.visit_project_page()
      |> Steps.add_milestone(name: "New milestone")
      |> Steps.assert_add_milestone_form_closed()
      |> Steps.assert_milestone_created(name: "New milestone")
      |> then(fn ctx ->
        milestone = Operately.Repo.get_by(Operately.Projects.Milestone, title: "New milestone")
        Map.put(ctx, :milestone, milestone)
      end)
      |> Steps.assert_milestone_creation_notification_sent()
      |> Steps.assert_milestone_creation_email_sent()
      |> Steps.assert_milestone_creation_visible_in_feed()
    end

    feature "create and delete milestone, verify notifications and feed still work", ctx do
      ctx
      |> UI.login_as(ctx.reviewer)
      |> Steps.visit_project_page()
      |> Steps.add_milestone(name: "Temporary milestone")
      |> Steps.assert_add_milestone_form_closed()
      |> Steps.assert_milestone_created(name: "Temporary milestone")
      |> then(fn ctx ->
        milestone = Operately.Repo.get_by(Operately.Projects.Milestone, title: "Temporary milestone")
        Map.put(ctx, :milestone, milestone)
      end)
      |> Steps.visit_milestone_page()
      |> Steps.delete_milestone()
      |> Steps.assert_redirected_to_project_page()
      |> Steps.assert_milestone_deleted()
      |> Steps.assert_milestone_creation_notification_sent()
      |> Steps.assert_milestone_creation_email_sent()
      |> Steps.assert_milestone_creation_visible_in_feed()
    end
  end

  describe "Milestone page" do
    setup ctx do
      Steps.given_that_a_milestone_exists(ctx, "My milestone")
    end

    feature "assert newly created milestone page", ctx do
      due_date = get_milestone_due_date(ctx.milestone)
      formatted_date = Operately.Support.Time.format_month_day(due_date)

      ctx
      |> Steps.visit_milestone_page()
      |> Steps.assert_empty_description()
      |> Steps.assert_milestone_status("Active")
      |> Steps.assert_milestone_timeline_empty()
      |> Steps.assert_milestone_due_date(formatted_date)
    end

    feature "edit milestone due date", ctx do
      next_friday = Operately.Support.Time.next_friday()
      formatted_date = Operately.Support.Time.format_month_day(next_friday)

      ctx
      |> Steps.visit_milestone_page()
      |> Steps.edit_milestone_due_date(next_friday)
      |> Steps.assert_milestone_due_date(formatted_date)
      |> Steps.assert_activity_added_to_feed("updated the milestone")
      |> Steps.reload_milestone_page()
      |> Steps.assert_milestone_due_date(formatted_date)
      |> Steps.assert_activity_added_to_feed("updated the milestone")
      |> Steps.assert_milestone_due_date_change_visible_in_feed()
    end

    feature "edit milestone due date when project doesn't have a champion", ctx do
      next_friday = Operately.Support.Time.next_friday()
      formatted_date = Operately.Support.Time.format_month_day(next_friday)

      ctx
      |> Steps.given_that_milestone_project_doesnt_have_champion()
      |> Steps.visit_milestone_page()
      |> Steps.edit_milestone_due_date(next_friday)
      |> Steps.assert_milestone_due_date(formatted_date)
      |> Steps.reload_milestone_page()
      |> Steps.assert_milestone_due_date(formatted_date)
    end

    feature "edit milestone due date sends notification to champion", ctx do
      next_friday = Operately.Support.Time.next_friday()
      formatted_date = Operately.Support.Time.format_month_day(next_friday)

      ctx
      |> UI.login_as(ctx.reviewer)
      |> Steps.visit_milestone_page()
      |> Steps.edit_milestone_due_date(next_friday)
      |> Steps.assert_milestone_due_date(formatted_date)
      |> Steps.assert_due_date_changed_notification_sent()
      |> Steps.assert_due_date_changed_email_sent()
    end

    feature "remove milestone due date sends notification to champion", ctx do
      ctx
      |> UI.login_as(ctx.reviewer)
      |> Steps.visit_milestone_page()
      |> Steps.remove_milestone_due_date()
      |> Steps.assert_no_due_date()
      |> Steps.assert_due_date_removed_notification_sent()
      |> Steps.assert_due_date_changed_email_sent()
    end

    feature "mentioning a person in a milestone description sends notification and email", ctx do
      ctx = Steps.given_space_member_exists(ctx)

      ctx
      |> Steps.visit_milestone_page()
      |> Steps.assert_empty_description()
      |> Steps.edit_milestone_description_mentioning(ctx.space_member)

      ctx
      |> Steps.assert_space_member_milestone_description_notification_sent()
      |> Steps.assert_space_member_milestone_description_email_sent()
    end

    feature "milestone shows description indicator when description is added", ctx do
      ctx
      |> Steps.visit_tasks_tab_on_project_page()
      |> Steps.assert_milestone_description_indicator_not_visible()
      |> Steps.visit_project_page()
      |> Steps.assert_milestone_description_indicator_not_visible_on_overview()
      |> Steps.visit_milestone_page()
      |> Steps.edit_milestone_description("This is a milestone description")
      |> Steps.visit_tasks_tab_on_project_page()
      |> Steps.assert_milestone_description_indicator_visible()
      |> Steps.visit_project_page()
      |> Steps.assert_milestone_description_indicator_visible_on_overview()
    end

    feature "mark milestone as completed", ctx do
      ctx
      |> Steps.visit_milestone_page()
      |> Steps.mark_milestone_as_completed()
      |> Steps.assert_milestone_status("Completed")
      |> Steps.assert_activity_added_to_feed("completed the milestone")
      |> Steps.reload_milestone_page()
      |> Steps.assert_milestone_status("Completed")
      |> Steps.assert_activity_added_to_feed("completed the milestone")
    end

    feature "mark milestone as completed updates project page", ctx do
      ctx
      |> Steps.visit_tasks_tab_on_project_page()
      |> Steps.assert_milestone_visible_in_tasks_board(name: ctx.milestone.title)
      |> Steps.navigate_to_milestone(name: ctx.milestone.title)
      |> Steps.mark_milestone_as_completed()
      |> Steps.assert_milestone_status("Completed")
      |> Steps.assert_activity_added_to_feed("completed the milestone")
      |> Steps.navigate_to_tasks_board()
      |> Steps.refute_milestone_visible_in_tasks_board(name: ctx.milestone.title)
    end

    feature "reopen milestone", ctx do
      ctx
      |> Steps.given_that_milestone_is_completed()
      |> Steps.visit_milestone_page()
      |> Steps.reopen_milestone()
      |> Steps.assert_milestone_status("Active")
      |> Steps.assert_activity_added_to_feed("re-opened the milestone")
      |> Steps.reload_milestone_page()
      |> Steps.assert_milestone_status("Active")
      |> Steps.assert_activity_added_to_feed("re-opened the milestone")
    end

    feature "reopen milestone updates project page", ctx do
      ctx
      |> Steps.given_that_milestone_is_completed()
      |> Steps.visit_tasks_tab_on_project_page()
      |> Steps.refute_milestone_visible_in_tasks_board(name: ctx.milestone.title)
      |> Steps.visit_milestone_page()
      |> Steps.reopen_milestone()
      |> Steps.assert_milestone_status("Active")
      |> Steps.assert_activity_added_to_feed("re-opened the milestone")
      |> Steps.navigate_to_tasks_board()
      |> Steps.assert_milestone_visible_in_tasks_board(name: ctx.milestone.title)
    end

    feature "add a task", ctx do
      ctx
      |> Steps.visit_milestone_page()
      |> Steps.add_task(name: "My task")
      |> Steps.assert_task_created(name: "My task")
      |> Steps.assert_activity_added_to_feed("created \"My task\"")
      |> Steps.reload_milestone_page()
      |> Steps.assert_task_created(name: "My task")
      |> Steps.assert_activity_added_to_feed("created \"My task\"")
    end

    feature "add multiple tasks", ctx do
      ctx
      |> Steps.visit_milestone_page()
      |> Steps.add_multiple_tasks(names: ["1st task", "2nd task"])
      |> Steps.assert_add_task_form_closed()
      |> Steps.assert_task_created(name: "1st task")
      |> Steps.assert_task_created(name: "2nd task")
      |> Steps.assert_activity_added_to_feed("created \"1st task\"")
      |> Steps.assert_activity_added_to_feed("created \"2nd task\"")
      |> Steps.reload_milestone_page()
      |> Steps.assert_task_created(name: "1st task")
      |> Steps.assert_task_created(name: "2nd task")
      |> Steps.assert_activity_added_to_feed("created \"1st task\"")
      |> Steps.assert_activity_added_to_feed("created \"2nd task\"")
    end

    feature "post comment to milestone", ctx do
      comment = "This is a comment"

      ctx
      |> Steps.visit_milestone_page()
      |> Steps.post_comment(comment)
      |> Steps.assert_comment(comment)
      |> Steps.reload_milestone_page()
      |> Steps.assert_comment(comment)
      |> Steps.assert_comment_visible_in_feed(comment)
      |> Steps.assert_comment_email_sent_to_project_reviewer()
      |> Steps.assert_comment_notification_sent_to_project_reviewer()
    end

    feature "mentioning a teammate in a milestone comment sends alerts", ctx do
      ctx = Steps.given_space_member_exists(ctx)

      person_first_name = Operately.People.Person.first_name(ctx.space_member)

      ctx
      |> Steps.visit_milestone_page()
      |> Steps.post_comment_with_mention(ctx.space_member)
      |> Steps.assert_comment(person_first_name)
      |> Steps.reload_milestone_page()
      |> Steps.assert_comment(person_first_name)
      |> Steps.assert_comment_visible_in_feed(person_first_name)
      |> Steps.assert_comment_email_sent_to_space_member()
      |> Steps.assert_comment_notification_sent_to_space_member()
    end

    feature "post comment then delete milestone, verify feed and notifications don't break", ctx do
      comment = "This is a comment"

      ctx
      |> Steps.visit_milestone_page()
      |> Steps.post_comment(comment)
      |> Steps.assert_comment(comment)
      |> Steps.delete_milestone()
      |> Steps.assert_redirected_to_project_page()
      |> Steps.assert_milestone_deleted()
      |> Steps.assert_comment_visible_in_feed_after_deletion(comment)
      |> Steps.assert_comment_email_sent_to_project_reviewer()
      |> Steps.assert_comment_notification_sent_after_deletion()
    end

    feature "milestone shows comment indicator with count when comments exist", ctx do
      ctx
      |> Steps.given_milestone_without_comments_exists()
      |> Steps.given_milestone_with_comments_exists()
      |> Steps.visit_tasks_tab_on_project_page()
      |> Steps.assert_milestone_comment_indicator_not_visible()
      |> Steps.assert_milestone_comment_count(2)
      |> Steps.visit_project_page()
      |> Steps.assert_milestone_comment_indicator_not_visible_on_overview()
      |> Steps.assert_milestone_comment_count_on_overview(2)
    end

    feature "edit milestone comment", ctx do
      new_comment = "Edited comment"

      ctx
      |> Steps.given_that_milestone_has_comment()
      |> Steps.visit_milestone_page()
      |> Steps.assert_comment("Content")
      |> Steps.edit_comment(new_comment)
      |> Steps.assert_comment(new_comment)
      |> Steps.reload_milestone_page()
      |> Steps.assert_comment(new_comment)
    end

    feature "delete milestone comment", ctx do
      ctx
      |> Steps.given_that_milestone_has_comment()
      |> Steps.visit_milestone_page()
      |> Steps.assert_comment("Content")
      |> Steps.delete_comment()
      |> Steps.assert_comment_deleted()
      |> Steps.reload_milestone_page()
      |> Steps.assert_comment_deleted()
    end

    feature "comment menu not visible to other users", ctx do
      ctx
      |> Steps.given_that_milestone_has_comment()
      |> Steps.given_space_member_exists()
      |> Factory.log_in_person(:space_member)
      |> Steps.visit_milestone_page()
      |> Steps.assert_comment("Content")
      |> Steps.assert_comment_menu_not_visible()
    end

    feature "post comment then delete comment, verify feed doesn't break", ctx do
      comment = "This is a comment"

      ctx
      |> Steps.visit_milestone_page()
      |> Steps.post_comment(comment)
      |> Steps.assert_comment(comment)
      |> Steps.delete_comment_by_content()
      |> Steps.assert_comment_deleted()
      |> Steps.assert_comment_visible_in_feed_after_deletion()
    end

    feature "delete milestone", ctx do
      ctx
      |> Steps.visit_milestone_page()
      |> Steps.delete_milestone()
      |> Steps.assert_redirected_to_project_page()
      |> Steps.assert_milestone_deleted()
      |> Steps.assert_milestone_deleted_visible_in_feed()
    end

    feature "delete milestone when project doesn't have champion", ctx do
      ctx
      |> Steps.given_that_milestone_project_doesnt_have_champion()
      |> Steps.visit_milestone_page()
      |> Steps.delete_milestone()
      |> Steps.assert_redirected_to_project_page()
      |> Steps.assert_milestone_deleted()
    end
  end

  defp get_milestone_due_date(milestone) do
    Operately.ContextualDates.Timeframe.end_date(milestone.timeframe)
  end
end
