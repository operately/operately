defmodule Operately.Features.CompaniesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.CompaniesSteps, as: Steps

  set_app_config(:billing_enabled, true)

  feature "creating another company (not first one)", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_that_belongs_to_a_company()
    |> Steps.navigate_to_the_loby()
    |> Steps.click_on_the_add_company_button()
    |> Steps.fill_in_company_form_and_submit()
    |> Steps.assert_company_is_created()
    |> Steps.assert_welcome_from_marko_is_shown()
    |> Steps.click_lets_start()
    |> Steps.select_a_few_spaces_to_create()
    |> Steps.assert_i_get_an_invitation_token()
    |> Steps.complete_onboarding()
    |> Steps.assert_spaces_are_created()
  end

  feature "creating another company remembers billing intent from query params", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_that_belongs_to_a_company()
    |> Steps.navigate_to_new_company_page_with_billing_intent()
    |> Steps.fill_in_company_form_and_submit()
    |> Steps.assert_company_is_created()
    |> Steps.assert_welcome_from_marko_is_shown()
    |> Steps.assert_billing_intent_is_saved()
  end
end
