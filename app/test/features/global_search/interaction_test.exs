defmodule Operately.Features.GlobalSearch.InteractionTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GlobalSearchSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "no results found", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("NonexistentItem")
    |> Steps.assert_no_results_message()
  end

  feature "search requires minimum 2 characters", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("A")
    |> Steps.assert_search_not_triggered()
  end

  feature "close search with escape key", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("test")
    |> Steps.press_escape()
    |> Steps.assert_search_closed()
  end

  feature "close search by clicking outside", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("test")
    |> Steps.click_outside_search()
    |> Steps.assert_search_closed()
  end

  feature "search shows loading state", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.start_typing("Website")
    |> Steps.assert_searching_indicator()
  end
end
