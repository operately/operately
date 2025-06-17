defmodule Operately.Support.Features.GoalSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.FeedSteps

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
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "activity"))
    |> FeedSteps.assert_feed_item_exists(ctx.creator, "changed the champion")
  end

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
