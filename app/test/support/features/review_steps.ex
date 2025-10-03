defmodule Operately.Support.Features.ReviewSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:me, [name: "Michael Scott"])
    |> Factory.add_company_member(:my_manager, [name: "David Wallace"])
    |> Factory.add_company_member(:my_report, [name: "Dwight Schrute"])
    |> Factory.add_space(:product_space)
    |> Factory.log_in_person(:me)
  end

  step :visit_review_page, ctx do
    ctx |> UI.visit(Paths.review_path(ctx.company))
  end

  #
  # Zero state
  #

  step :assert_zero_state_message, ctx do
    ctx
    |> UI.assert_text("Review")
    |> UI.assert_text("All caught up!")
    |> UI.assert_text("Nothing to review")
  end

  step :assert_zero_state_message, ctx, :v2 do
    ctx
    |> UI.find([testid: "due-soon-section"], fn el ->
      el
      |> UI.assert_text("No urgent work")
      |> UI.assert_text("You're all caught up on immediate priorities.")
    end)
    |> UI.find([testid: "needs-review-section"], fn el ->
      el
      |> UI.assert_text("Nothing to review")
      |> UI.assert_text("No check-ins or updates need your review.")
    end)
    |> UI.find([testid: "upcoming-section"], fn el ->
      el
      |> UI.assert_text("No upcoming work")
      |> UI.assert_text("Nothing else is scheduled for you yet.")
    end)
  end

  #
  # Due Project Check-ins
  #

  step :given_there_are_due_project_check_ins, ctx do
    ctx
    |> Factory.add_project(:project, :product_space, [
      champion: :me,
      reviewer: :my_manager,
      name: "Release Dunder Mifflin Infinity"
    ])
    |> Factory.set_project_next_check_in_date(:project, past_date())
  end

  step :assert_the_due_project_is_listed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.assert_text("Write the weekly check-in: #{ctx.project.name}")
  end

  step :assert_the_due_project_is_listed, ctx, :v2 do
    ctx
    |> UI.find([testid: "due-soon-section"], fn el ->
      el
      |> UI.assert_text(ctx.project.name)
      |> UI.assert_text("Submit weekly check-in")
      |> UI.assert_text("3 days overdue")
    end)
  end

  step :when_a_project_check_in_is_submitted, ctx do
    ctx
    |> UI.click(testid: UI.testid(["assignment", Paths.project_id(ctx.project)]))
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-on_track")
    |> UI.fill_rich_text("Going well")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "project-check-in-page")
  end

  step :assert_the_checked_in_project_is_no_longer_displayed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.project.name)
    |> UI.assert_text("All caught up!")
  end

  step :assert_the_checked_in_project_is_no_longer_displayed, ctx, :v2 do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.project.name)
    |> UI.find([testid: "due-soon-section"], fn el ->
      UI.assert_text(el, "No urgent work")
    end)
  end

  #
  # Due Milestones
  #

  step :given_there_are_due_milestones, ctx do
    ctx
    |> Factory.add_project(:project, :product_space, [
      champion: :me,
      reviewer: :my_manager,
      name: "Release Dunder Mifflin Infinity"
    ])
    |> Factory.add_project_milestone(:milestone, :project, [
      title: "Important Work",
      timeframe: %Operately.ContextualDates.Timeframe{
        contextual_start_date: nil,
        contextual_end_date: Operately.ContextualDates.ContextualDate.create_day_date(past_date())
      },
    ])
  end

  step :assert_the_due_milestone_is_listed, ctx do
    ctx
    |> UI.find([testid: "due-soon-section"], fn el ->
      el
      |> UI.assert_text(ctx.project.name)
      |> UI.assert_text("Complete Important Work")
      |> UI.assert_text("3 days overdue")
    end)
  end

  step :when_a_milestone_is_marked_as_completed, ctx do
    ctx
    |> UI.click(testid: UI.testid(["assignment", Paths.milestone_id(ctx.milestone)]))
    |> UI.click_button("Mark complete")
    |> UI.find([testid: "sidebar-status"], fn el ->
      UI.assert_text(el, "Completed")
    end)
  end

  step :assert_completed_milestone_is_no_longer_displayed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.project.name)
    |> UI.refute_text("Complete Important Work")
    |> UI.find([testid: "due-soon-section"], fn el ->
      UI.assert_text(el, "No urgent work")
    end)
  end

  step :create_milestone, ctx do
    milestone_name = "Milestone For Review Counter"

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "add-milestone-button")
    |> UI.fill(testid: "milestone-name-input", with: milestone_name)
    |> UI.find([testid: "add-milestone-form"], fn el ->
      UI.click_button(el, "Add milestone")
    end)
    |> UI.sleep(300)
    |> then(fn ctx ->
      milestone = Operately.Projects.get_milestone_by_name(ctx.project, milestone_name)

      Map.put(ctx, :milestone, milestone)
    end)
  end

  step :delete_milestone, ctx do
    ctx
    |> UI.visit(Paths.project_milestone_path(ctx.company, ctx.milestone))
    |> UI.find([testid: "sidebar"], fn el ->
      UI.click_button(el, "Delete")
    end)
    |> UI.click(testid: "delete-milestone")
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
  end

  step :complete_milestone, ctx do
    ctx
    |> UI.visit(Paths.project_milestone_path(ctx.company, ctx.milestone))
    |> UI.find([testid: "sidebar-status"], fn el ->
      UI.click_button(el, "Mark complete")
    end)
    |> UI.sleep(300)
  end

  #
  # Due Tasks
  #

  step :given_there_are_tasks_without_assignee, ctx do
    ctx
    |> Factory.add_project_task(:task, nil, [
      name: "Urgent Feature",
      project_id: ctx.project.id,
      due_date: Operately.ContextualDates.ContextualDate.create_day_date(past_date()),
    ])
  end

  step :given_there_are_due_tasks, ctx do
    ctx
    |> Factory.add_project(:project, :product_space, [
      champion: :me,
      reviewer: :my_manager,
      name: "Release Dunder Mifflin Infinity"
    ])
    |> Factory.add_project_milestone(:milestone, :project, [
      timeframe: %Operately.ContextualDates.Timeframe{
        contextual_start_date: nil,
        contextual_end_date: nil,
      },
    ])
    |> Factory.add_project_task(:task, :milestone, [
      name: "Urgent Feature",
      due_date: Operately.ContextualDates.ContextualDate.create_day_date(past_date()),
    ])
    |> Factory.add_task_assignee(:assignee, :task, :me)
  end

  step :assert_due_task_is_listed, ctx do
    ctx
    |> UI.find([testid: "due-soon-section"], fn el ->
      el
      |> UI.assert_text(ctx.project.name)
      |> UI.assert_text("Complete Urgent Feature")
      |> UI.assert_text("3 days overdue")
    end)
  end

  step :when_task_is_marked_as_completed, ctx do
    ctx
    |> UI.click(testid: UI.testid(["assignment", Paths.task_id(ctx.task)]))
    |> UI.click_text("Not started")
    |> UI.click_text("Done")
    |> UI.sleep(500)
  end

  step :assert_completed_task_is_no_longer_displayed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text("Complete Urgent Feature")
    |> UI.find([testid: "due-soon-section"], fn el ->
      el
      |> UI.assert_text("No urgent work")
    end)
  end

  step :create_task, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "tasks"))
    |> UI.click_button("New task")
    |> UI.fill(placeholder: "Enter task title", with: "Some Task")
    |> UI.click(testid: "assignee")
    |> UI.click(testid: UI.testid(["assignee-search-result", ctx.me.full_name]))
    |> UI.click_button("Create task")
  end

  step :delete_task, ctx do
    ctx
    |> UI.click_text("Some Task")
    |> UI.click(testid: "delete-task")
    |> UI.click_button("Delete Forever")
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
  end

  step :change_task_assignee, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "tasks"))
    |> UI.click(testid: "person-field")
    |> UI.click(testid: UI.testid(["person-field-search-result", ctx.me.full_name]))
    |> UI.sleep(300)
  end

  step :clear_task_assignee, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project, tab: "tasks"))
    |> UI.click(testid: "person-field")
    |> UI.click(testid: "person-field-clear-assignment")
    |> UI.sleep(300)
  end

  step :mark_task_as_completed, ctx do
    ctx
    |> UI.visit(Paths.project_task_path(ctx.company, ctx.task))
    |> UI.click(testid: "task-quick-complete")
    |> UI.sleep(300)
  end

  step :mark_task_as_not_started, ctx do
    ctx
    |> UI.visit(Paths.project_task_path(ctx.company, ctx.task))
    |> UI.click_button("Done")
    |> UI.click_text("Not started")
    |> UI.sleep(300)
  end

  step :mark_task_as_canceled, ctx do
    ctx
    |> UI.visit(Paths.project_task_path(ctx.company, ctx.task))
    |> UI.click_button("Not started")
    |> UI.click_text("Canceled")
    |> UI.sleep(300)
  end

  #
  # Due Goal Updates
  #

  step :given_there_are_due_goal_updates, ctx do
    ctx
    |> Factory.add_goal(:goal, :product_space, [
      champion: :me,
      reviewer: :my_manager,
      name: "Expand the customer base"
    ])
    |> Factory.set_goal_next_update_date(:goal, past_date())
  end

  step :assert_the_due_goal_is_listed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.assert_text("Update progress: #{ctx.goal.name}")
  end

  step :assert_the_due_goal_is_listed, ctx, :v2 do
    ctx
    |> UI.find([testid: "due-soon-section"], fn el ->
      el
      |> UI.assert_text(ctx.goal.name)
      |> UI.assert_text("Submit goal progress update")
      |> UI.assert_text("3 days overdue")
    end)
  end

  step :when_a_goal_update_is_submitted, ctx do
    ctx
    |> UI.click(testid: UI.testid(["assignment", Paths.goal_id(ctx.goal)]))
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-option-on-track")
    |> UI.fill_rich_text("Going well")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "goal-check-in-page")
  end

  step :assert_the_updated_goal_is_no_longer_displayed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.goal.name)
    |> UI.assert_text("Nothing to review")
  end

  step :assert_the_updated_goal_is_no_longer_displayed, ctx, :v2 do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.goal.name)
    |> UI.find([testid: "due-soon-section"], fn el ->
      UI.assert_text(el, "No urgent work")
    end)
  end

  #
  # Due Project Check-ins Review
  #

  step :given_there_are_submitted_project_check_ins, ctx do
    ctx
    |> Factory.add_project(:project, :product_space, [
      champion: :my_report,
      reviewer: :me,
      name: "Release Dunder Mifflin Infinity"
    ])
    |> Factory.add_project_check_in(:check_in, :project, :my_report)
  end

  step :assert_the_submitted_project_is_listed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.assert_text("Review: #{ctx.project.name}")
  end

  step :assert_due_project_check_in_review_is_listed, ctx do
    ctx
    |> UI.find([testid: "needs-review-section"], fn el ->
      el
      |> UI.assert_text(ctx.project.name)
      |> UI.assert_text("Review weekly check-in")
      |> UI.assert_text("Due today")
    end)
  end

  step :when_a_project_check_in_is_acknowledged, ctx do
    ctx
    |> UI.click(testid: UI.testid(["assignment", Paths.project_check_in_id(ctx.check_in)]))
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.assert_text("Acknowledged")
  end

  step :assert_the_acknowledged_project_is_no_longer_displayed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.project.name)
    |> UI.assert_text("Nothing to review")
  end

  step :assert_the_acknowledged_project_is_no_longer_displayed, ctx, :v2 do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.project.name)
    |> UI.find([testid: "needs-review-section"], fn el ->
      UI.assert_text(el, "Nothing to review")
    end)
  end

  #
  # Due Goal Update Review
  #

  step :given_there_are_submitted_goal_updates, ctx do
    ctx
    |> Factory.add_goal(:goal, :product_space, [
      champion: :my_report,
      reviewer: :me,
      name: "Expand the customer base"
    ])
    |> Factory.add_goal_update(:goal_update, :goal, :my_report)
  end

  step :assert_the_submitted_goal_is_listed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.assert_text(ctx.goal.name)
  end

  step :assert_due_goal_check_in_review_is_listed, ctx do
    ctx
    |> UI.find([testid: "needs-review-section"], fn el ->
      el
      |> UI.assert_text(ctx.goal.name)
      |> UI.assert_text("Review goal progress update")
      |> UI.assert_text("Due today")
    end)
  end

  step :when_a_goal_update_is_acknowledged, ctx do
    ctx
    |> UI.click(testid: UI.testid(["assignment", Paths.goal_update_id(ctx.goal_update)]))
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.assert_text("Acknowledged")
  end

  step :assert_the_acknowledged_goal_is_no_longer_displayed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.goal.name)
    |> UI.assert_text("All caught up!")
  end

  step :assert_the_acknowledged_goal_is_no_longer_displayed, ctx, :v2 do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.goal.name)
    |> UI.find([testid: "needs-review-section"], fn el ->
      UI.assert_text(el, "Nothing to review")
    end)
  end

  #
  # Project Closing
  #

  step :when_a_project_is_closed, ctx do
    ctx |> Factory.close_project(:project)
  end

  step :assert_the_closed_project_is_no_longer_displayed, ctx do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.project.name)
  end

  step :assert_the_closed_project_is_no_longer_displayed, ctx, :v2 do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.refute_text(ctx.project.name)
    |> UI.find([testid: "due-soon-section"], fn el ->
      UI.assert_text(el, "No urgent work")
    end)
  end

  #
  # Review Item Counter
  #

  step :assert_the_review_item_count, ctx, [is: count] do
    UI.assert_text(ctx, Integer.to_string(count), testid: "review-link-count")
  end

  #
  # Helpers
  #

  defp past_date do
    Date.utc_today()
    |> Date.add(-3)
    |> Operately.Time.as_datetime()
  end

end
