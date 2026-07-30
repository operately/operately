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
    |> Steps.search_for("renewal evidence")
    |> Steps.assert_search_location("renewal evidence")
    |> Steps.assert_project_result("Customer portal")
  end
end
