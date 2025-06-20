defmodule Operately.Support.Features.GoalSteps do
  use Operately.FeatureCase

  alias Operately.Access

  def setup(ctx) do
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
      timeframe: %{
        start_date: Operately.Time.days_ago(10) |> Operately.Time.as_date(),
        end_date: Operately.Time.days_from_now(10) |> Operately.Time.as_date(),
        type: "days"
      },
      parent_goal: :parent_goal
    )
    |> Factory.log_in_person(:champion)
    |> then(fn ctx ->
      UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
    end)
  end

  #
  # Changing the goal name
  #

  step :change_goal_name, ctx do
    ctx
    |> UI.fill_text_field(testid: "goal-name-field", with: "New Goal Name")
  end

  step :assert_goal_name_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.name == "New Goal Name"
    end)
  end

  step :assert_goal_name_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "renamed")
  end

  #
  # Changing the parent goal
  #

  step :change_parent_goal, ctx do
    ctx
    |> Factory.add_goal(:new_parent, :product, name: "Example Goal")
    |> UI.click(testid: "parent-goal-field")
    |> UI.click(testid: "parent-goal-field-search")
    |> UI.click(testid: "parent-goal-field-example-goal")
  end

  step :assert_parent_goal_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.parent_goal_id == ctx.new_parent.id
    end)
  end

  #
  # Removing the parent goal
  #

  step :remove_parent_goal, ctx do
    ctx
    |> UI.click(testid: "parent-goal-field")
    |> UI.click(testid: "parent-goal-field-clear")
  end

  step :assert_parent_goal_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.parent_goal_id == nil
    end)
  end

  #
  # Changing the champion
  #

  step :change_champion, ctx do
    ctx
    |> Factory.add_space_member(:new_champion, :product, name: "Alfred Newfield")
    |> UI.click(testid: "champion-field")
    |> UI.click(testid: "champion-field-assign-another")
    |> UI.click(testid: "champion-field-search-result-alfred-newfield")
  end

  step :assert_champion_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.champion_id == ctx.new_champion.id
    end)
  end

  step :assert_champion_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "assigned Alfred N. as the champion")
  end

  #
  # Removing the champion
  #

  step :remove_champion, ctx do
    ctx
    |> UI.click(testid: "champion-field")
    |> UI.click(testid: "champion-field-clear-assignment")
  end

  step :assert_champion_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.champion_id == nil
    end)
  end

  step :assert_champion_removed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "removed the champion")
  end

  #
  # Changing the reviewer
  #

  step :change_reviewer, ctx do
    ctx
    |> Factory.add_space_member(:new_reviewer, :product, name: "Alfred Newfield")
    |> UI.click(testid: "reviewer-field")
    |> UI.click(testid: "reviewer-field-assign-another")
    |> UI.click(testid: "reviewer-field-search-result-alfred-newfield")
  end

  step :assert_reviewer_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.reviewer_id == ctx.new_reviewer.id
    end)
  end

  step :assert_reviewer_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "assigned Alfred N. as the reviewer")
  end

  #
  # Removing the reviewer
  #

  step :remove_reviewer, ctx do
    ctx
    |> UI.click(testid: "reviewer-field")
    |> UI.click(testid: "reviewer-field-clear-assignment")
  end

  step :assert_reviewer_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.reviewer_id == nil
    end)
  end

  step :assert_reviewer_removed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "removed the reviewer")
  end

  #
  # Changing the due date
  #

  step :change_due_date, ctx do
    new_date = Operately.Time.days_from_now(3) |> Operately.Time.as_date()

    ctx
    |> Map.put(:selected_date, new_date)
    |> UI.select_day_in_datepicker(testid: "due-date-field", date: new_date)
  end

  step :assert_due_date_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.timeframe.end_date == ctx.selected_date
    end)
  end

  step :assert_due_date_changed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "changed the due date")
  end

  #
  # Removing the due date
  #

  step :remove_due_date, ctx do
    ctx
    |> UI.click(testid: "due-date-field")
    |> UI.click(testid: "due-date-field-clear")
  end

  step :assert_due_date_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.timeframe == nil
    end)
  end

  step :assert_due_date_removed_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.creator, "cleared the due date")
  end

  #
  # Moving the goal to another space
  #

  step :move_goal_to_another_space, ctx do
    ctx
    |> UI.click(testid: "move-to-another-space")
    |> UI.click(testid: "space-field")
    |> UI.click(testid: "space-field-search-result-general")
    |> UI.click(testid: "save")
  end

  step :assert_goal_moved_to_another_space, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      space = Operately.Repo.preload(goal, [:group]).group

      assert space.name == "General"
    end)
  end

  #
  # Adding a new target
  #

  step :add_new_target, ctx do
    ctx
    |> UI.click(testid: "add-target")
    |> UI.fill(testid: "target-name", with: "New Target")
    |> UI.fill(testid: "target-from", with: "0")
    |> UI.fill(testid: "target-to", with: "100")
    |> UI.fill(testid: "target-unit", with: "Requests")
    |> UI.click(testid: "save")
  end

  step :assert_target_added, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      targets = Operately.Repo.preload(goal, [:targets]).targets

      target = Enum.find(targets, fn t -> t.name == "New Target" end)

      assert target != nil
      assert target.from == 0
      assert target.to == 100
      assert target.unit == "Requests"
    end)
  end

  #
  # Deleting a target
  #

  step :delete_target, ctx do
    target = Operately.Repo.preload(ctx.goal, [:targets]).targets |> List.first()

    ctx
    |> Map.put(:target, target)
    |> UI.click(testid: UI.testid(["target", target.name]))
    |> UI.click(testid: "delete-target")
    |> UI.click(testid: "confirm")
  end

  step :assert_target_deleted, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      targets = Operately.Repo.preload(goal, [:targets]).targets

      refute Enum.any?(targets, fn t -> t.name == ctx.target.name end)
    end)
  end

  #
  # Updating a target value
  #

  step :update_target_value, ctx do
    target = Operately.Repo.preload(ctx.goal, [:targets]).targets |> List.first()

    ctx
    |> Map.put(:target, target)
    |> UI.click(testid: UI.testid(["update-target", target.name]))
    |> UI.fill(testid: "target-value", with: "200")
    |> UI.click(testid: "save")
  end

  step :assert_target_value_updated, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      targets = Operately.Repo.preload(goal, [:targets]).targets

      target = Enum.find(targets, fn t -> t.id == ctx.target.id end)

      assert target != nil
      assert target.value == 200
    end)
  end

  #
  # Deleting a goal
  #

  step :delete_goal, ctx do
    ctx
    |> UI.click(testid: "delete-goal")
    |> UI.click(testid: "delete")
  end

  step :assert_goal_deleted, ctx do
    attempts(ctx, 3, fn ->
      assert Operately.Repo.reload(ctx.goal) == nil
    end)
  end

  #
  # Goal with subgoals cannot be deleted
  #

  step :given_goal_has_subgoals, ctx do
    ctx
    |> Factory.add_goal(:subgoal, :product, parent_goal: :goal)
  end

  step :visit_page, ctx do
    UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
  end

  step :assert_goal_cannot_be_deleted, ctx do
    ctx
    |> UI.click(testid: "delete-goal")
    |> UI.assert_text("Cannot delete")
  end

  #
  # Changing the access level
  #

  step :change_access_level, ctx do
    ctx
    |> UI.click(testid: "goal-privacy-field")
    |> UI.select(testid: "goal-privacy-field-company-select", option: "No Access")
    |> UI.click(testid: "save")
  end

  step :assert_access_level_changed, ctx do
    attempts(ctx, 3, fn ->
      context = Access.get_context(goal_id: ctx.goal.id)
      company_members = Access.get_group!(company_id: ctx.goal.company_id, tag: :standard)
      company_binding = Access.get_binding(context_id: context.id, group_id: company_members.id)

      assert company_binding.access_level == 0
    end)
  end

  #
  # Utility functions
  #

  defp attempts(ctx, n, fun) do
    try do
      fun.()
      ctx
    rescue
      e in [ExUnit.AssertionError] ->
        if n > 0 do
          Process.sleep(100)
          attempts(ctx, n - 1, fun)
        else
          raise e
        end
    end
  end
end
