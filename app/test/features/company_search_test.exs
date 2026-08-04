defmodule Operately.Features.CompanySearchTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.CompanySearchSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "opens a shared body search and navigates to its result", ctx do
    ctx
    |> Steps.visit_search_page("approval workflow")
    |> Steps.assert_search_query("approval workflow")
    |> Steps.assert_project_result("Website redesign")
    |> Steps.assert_body_match_metadata()
    |> Steps.open_project_result()
    |> Steps.assert_project_page()
  end

  feature "searches again from the dedicated page", ctx do
    ctx
    |> Steps.visit_search_page()
    |> Steps.assert_initial_state()
    |> Steps.assert_refine_controls()
    |> Steps.search_for("renewal evidence")
    |> Steps.assert_search_location("renewal evidence")
    |> Steps.assert_project_result("Customer portal")
  end

  feature "filters search results by type", ctx do
    ctx
    |> Steps.add_filter_fixtures()
    |> Steps.visit_search_page("Shared filter marker")
    |> Steps.assert_result_visible("Product marker project")
    |> Steps.assert_result_visible("Product marker goal")
    |> Steps.filter_by_type("project")
    |> Steps.assert_result_visible("Product marker project")
    |> Steps.assert_result_hidden("Product marker goal")
  end

  feature "filters search results by space", ctx do
    ctx
    |> Steps.add_filter_fixtures()
    |> Steps.visit_search_page("Shared filter marker")
    |> Steps.filter_by_space(:marketing)
    |> Steps.assert_result_visible("Marketing marker project")
    |> Steps.assert_result_hidden("Product marker project")
    |> Steps.assert_result_hidden("Product marker goal")
  end

  feature "filters by time and sorts by most recent", ctx do
    ctx
    |> Steps.add_filter_fixtures()
    |> Steps.visit_search_page("Shared filter marker")
    |> Steps.filter_by_time("last_7_days")
    |> Steps.sort_by_most_recent()
    |> Steps.assert_result_visible("Marketing marker project")
    |> Steps.assert_result_visible("Product marker project")
    |> Steps.assert_result_hidden("Product marker goal")
    |> Steps.assert_first_result("Marketing marker project")
  end
end
