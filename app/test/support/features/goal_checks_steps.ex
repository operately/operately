defmodule Operately.Support.Features.GoalChecksSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product)
    |> Factory.add_space_member(:champion, :product)
    |> Factory.add_space_member(:reviewer, :product)
    |> Factory.add_goal(:parent_goal, :product)
    |> Factory.add_goal(:goal, :product,
      name: "Improve support first response time",
      champion: :champion,
      reviewer: :reviewer,
      timeframe: create_timeframe(),
      parent_goal: :parent_goal
    )
    |> Factory.log_in_person(:champion)
  end

  #
  # Listing existing goal checks
  #

  step :given_goal_has_multiple_checks, ctx do
    ctx
    |> Factory.add_goal_check(:check1, :goal, name: "Check 1")
    |> Factory.add_goal_check(:check2, :goal, name: "Check 2")
    |> Factory.add_goal_check(:check3, :goal, name: "Check 3")
  end

  step :visit_goal_page, ctx do
    UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
  end

  step :assert_goal_checks_listed, ctx do
    UI.assert_text(ctx, "Check 1")
    UI.assert_text(ctx, "Check 2")
    UI.assert_text(ctx, "Check 3")
  end

  #
  # Adding a new goal check
  #

  step :add_goal_check, ctx do
    ctx
    |> UI.click(testid: "add-checklist-item")
    |> UI.fill(testid: "checklist-item-name", with: "New Check")
    |> UI.click(testid: "save")
    |> UI.sleep(300)
  end

  step :assert_goal_check_added, ctx do
    attempts(ctx, 5, fn ->
      checks = Operately.Repo.preload(ctx.goal, :checks).checks
      assert Enum.any?(checks, fn check -> check.name == "New Check" end)
    end)
  end

  step :assert_check_added_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "added a new checklist item", "New Check")
  end

  #
  # Deleting a goal check
  #

  step :given_a_check_exists, ctx do
    ctx |> Factory.add_goal_check(:check, :goal, name: "Check 1")
  end

  step :delete_goal_check, ctx do
    ctx
    |> UI.hover(testid: UI.testid(["checklist-item", ctx.check.name]))
    |> UI.click(testid: UI.testid(["checklist-item-menu", OperatelyWeb.Paths.goal_check_id(ctx.check)]))
    |> UI.click(testid: "delete")
    |> UI.sleep(300)
  end

  step :assert_goal_check_deleted, ctx do
    attempts(ctx, 5, fn ->
      checks = Operately.Repo.preload(ctx.goal, :checks).checks
      refute Enum.any?(checks, fn check -> check.name == "Check to Delete" end)
    end)
  end

  step :assert_check_removing_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "removed a checklist item", "Check to Delete")
  end

  #
  # Updating a check
  #

  step :update_goal_check, ctx do
    ctx
    |> UI.hover(testid: UI.testid(["checklist-item", ctx.check.name]))
    |> UI.click(testid: UI.testid(["checklist-item-menu", OperatelyWeb.Paths.goal_check_id(ctx.check)]))
    |> UI.click(testid: "edit")
    |> UI.fill(testid: "textfield", with: "Updated Check")
    |> UI.click(testid: "save")
    |> UI.sleep(300)
  end

  step :assert_goal_check_updated, ctx do
    attempts(ctx, 5, fn ->
      checks = Operately.Repo.preload(ctx.goal, :checks).checks
      assert Enum.any?(checks, fn check -> check.name == "Updated Check" end)
    end)
  end

  #
  # Toggling a check
  #

  step :toggle_goal_check, ctx do
    ctx
    |> UI.click(testid: UI.testid(["checkbox", ctx.check.name]))
    |> UI.sleep(300)
  end

  step :assert_check_completed, ctx do
    attempts(ctx, 5, fn ->
      assert Factory.reload(ctx, :check).check.completed
    end)
  end

  step :assert_check_pending, ctx do
    attempts(ctx, 5, fn ->
      refute Factory.reload(ctx, :check).check.completed
    end)
  end

  step :assert_check_completed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "marked a checklist item as completed", ctx.check.name)
  end

  step :assert_check_pending_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "marked a checklist item as pending", ctx.check.name)
  end

  #
  # Utility
  #

  defp create_timeframe do
    alias Operately.ContextualDates.ContextualDate

    %{
      contextual_start_date: Operately.Time.days_ago(10) |> ContextualDate.create_day_date(),
      contextual_end_date: Operately.Time.days_from_now(10) |> ContextualDate.create_day_date()
    }
  end
end
