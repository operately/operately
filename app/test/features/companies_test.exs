defmodule Operately.Features.CompaniesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.CompaniesSteps, as: Steps

  feature "creating another company (not first one)", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_that_belongs_to_a_company()
    |> Steps.navigate_to_the_loby()
    |> Steps.click_on_the_add_company_button()
    |> Steps.fill_in_company_form_and_submit()
    |> Steps.assert_company_is_created()
    |> Steps.assert_feed_displays_company_creation()
  end
end
