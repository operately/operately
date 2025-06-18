defmodule Operately.Support.Features.GoalSteps do
  use Operately.FeatureCase

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:product)
    |> Factory.add_space_member(:champion, :product)
    |> Factory.add_space_member(:reviewer, :product)
    |> Factory.add_goal(:goal, :product,
      name: "Improve support first response time",
      champion: :champion,
      reviewer: :reviewer,
      timeframe: %{
        start_date: ~D[2023-01-01],
        end_date: ~D[2023-12-31],
        type: "year"
      }
    )
    |> Factory.log_in_person(:champion)
    |> then(fn ctx ->
      UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
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

  #
  # Changing the due date
  #

  step :change_due_date, ctx do
    ctx
    |> UI.click(testid: "due-date-field")
    |> UI.select_day_in_datepicker(testid: "due-date-datepicker", Operately.Time.days_from_now(3))
  end

  step :assert_due_date_changed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.timeframe.end_date == ~D[2024-12-31]
    end)
  end

  #
  # Removing the due date
  #

  step :remove_due_date, ctx do
    ctx
    |> UI.click(testid: "due-date-field")
    |> UI.click(testid: "due-date-clear")
  end

  step :assert_due_date_removed, ctx do
    attempts(ctx, 3, fn ->
      goal = Operately.Repo.reload(ctx.goal)
      assert goal.timeframe == nil
    end)
  end

  #
  # Utility functions
  #

  defp attempts(ctx, n, fun) do
    Enum.reduce(1..n, nil, fn i, _ ->
      try do
        fun.()
        ctx
      rescue
        e in [ExUnit.AssertionError] ->
          if i < n, do: Process.sleep(100)
          e
      end
    end)
  end
end
