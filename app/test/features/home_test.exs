defmodule Operately.Features.HomeTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.HomeSteps, as: Steps

  feature "company loads when person is member", ctx do
    ctx
    |> Steps.given_a_company_exists()
    |> Steps.given_a_user_is_logged_in_as_member()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_page_loaded()
  end

  feature "returns 404 when person is not member", ctx do
    ctx
    |> Steps.given_a_company_exists()
    |> Steps.given_a_user_is_logged_in_as_non_member()
    |> Steps.visit_company_home_page()
    |> Steps.assert_404_page()
  end
end
