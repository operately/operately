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

  step :visit_review_page, ctx do
    ctx |> UI.visit(Paths.review_path(ctx.company))
  end

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

  step :assert_the_review_item_count, ctx, [is: count] do
    ctx
    |> UI.visit(Paths.review_path(ctx.company))
    |> UI.assert_text(Integer.to_string(count), testid: "review-link-count")
  end

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
  # Helpers
  #

  defp past_date do
    Date.utc_today()
    |> Date.add(-3)
    |> Operately.Time.as_datetime()
  end

end
