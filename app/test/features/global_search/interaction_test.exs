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

  feature "search does not match discussion or document bodies", ctx do
    ctx
    |> Steps.given_body_only_matches_exist()
    |> Steps.open_global_search()
    |> Steps.search_for("buried-body-marker")
    |> Steps.assert_no_results_message()
  end

  feature "continues the current query on the full-text Search page when enabled", ctx do
    ctx
    |> Steps.enable_full_text_search()
    |> Steps.open_global_search()
    |> Steps.search_for("Website redesign")
    |> Steps.assert_full_text_search_action("Website redesign")
    |> Steps.open_full_text_search()
    |> Steps.assert_full_text_search_page("Website redesign")
  end

  feature "does not show the full-text action when the feature is disabled", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Website redesign")
    |> Steps.refute_full_text_search_action()
  end
end
