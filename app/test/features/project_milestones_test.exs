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

    feature "add multiple tasks with 'Create more' toggle on", ctx do
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
  end

  defp get_milestone_due_date(milestone) do
    Operately.ContextualDates.Timeframe.end_date(milestone.timeframe)
  end
end
