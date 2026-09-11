defmodule Operately.FeedBenchmarkTest do
  use ExUnit.Case, async: true

  alias Operately.FeedBenchmark

  test "history distribution is stable regardless of activity insertion order" do
    contexts = Enum.map(1..10, &"context-#{&1}")

    templates =
      for context <- contexts, action <- ["goal_created", "goal_closing"] do
        %Operately.Activities.Activity{access_context_id: context, action: action, content: %{"name" => action}}
      end

    rows = FeedBenchmark.Seed.history_rows(templates, contexts, 100) |> Enum.to_list()
    reversed = FeedBenchmark.Seed.history_rows(Enum.reverse(templates), contexts, 100) |> Enum.to_list()
    assert rows == reversed
    assert Enum.count(rows, &(&1.access_context_id in Enum.take(contexts, 2))) == 70
    assert length(Enum.uniq_by(rows, & &1.id)) == 100
    assert length(Enum.uniq_by(rows, & &1.inserted_at)) < 100
  end

  test "commands require development mode and the exact isolated database" do
    assert :ok = FeedBenchmark.validate_database!(:dev, "operately_feed_benchmark", true)

    for {env, database, enabled} <- [
          {:prod, "operately_feed_benchmark", true},
          {:dev, "operately_dev", true},
          {:dev, "operately_test", true},
          {:dev, "operately_feed_benchmark", false}
        ] do
      assert_raise ArgumentError, fn -> FeedBenchmark.validate_database!(env, database, enabled) end
    end
  end

  test "validates seed options without silently accepting typos" do
    assert FeedBenchmark.options([]) == %{activities: 20_000, reset: false}
    assert FeedBenchmark.options(["--activities", "100000", "--reset"]) == %{activities: 100_000, reset: true}

    for args <- [["--activities", "0"], ["--activities", "abc"], ["--unknown"], ["extra"]] do
      assert_raise ArgumentError, fn -> FeedBenchmark.options(args) end
    end
  end

  test "extracts only the home feed declaration and rejects unsupported declarations" do
    source = ~s(export const DISPLAYED_IN_FEED = ["goal_created", "project_created",];\nconst ignored = ["other"];)
    assert FeedBenchmark.parse_actions!(source) == ["goal_created", "project_created"]
    assert_raise ArgumentError, fn -> FeedBenchmark.parse_actions!("export const DISPLAYED_IN_FEED = actions;") end
    assert_raise ArgumentError, fn -> FeedBenchmark.parse_actions!("export const DISPLAYED_IN_FEED = [...actions];") end
  end

  test "dataset reuse requires matching version and parameters" do
    manifest = %{"version" => FeedBenchmark.version(), "activities" => 20_000}
    assert :reuse = FeedBenchmark.seed_action(manifest, %{activities: 20_000, reset: false})
    assert :reset = FeedBenchmark.seed_action(manifest, %{activities: 100_000, reset: true})
    assert :create = FeedBenchmark.seed_action(nil, %{activities: 20_000, reset: false})
    assert_raise ArgumentError, fn -> FeedBenchmark.seed_action(manifest, %{activities: 100_000, reset: false}) end
    assert_raise ArgumentError, fn -> FeedBenchmark.seed_action(%{manifest | "version" => -1}, %{activities: 20_000, reset: false}) end
  end

  test "a fast plan is not reported as reproducing the pathological join" do
    refute FeedBenchmark.pathological_plan?(%{"Plan" => %{"Node Type" => "Limit", "Actual Rows" => 21}})

    assert FeedBenchmark.pathological_plan?(%{
             "Plan" => %{
               "Node Type" => "Nested Loop",
               "Rows Removed by Join Filter" => 2_000_000,
               "Plans" => [%{"Node Type" => "Materialize", "Actual Loops" => 200, "Temp Read Blocks" => 1000}]
             }
           })
  end
end
