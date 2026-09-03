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
    |> Steps.assert_first_project_setup_is_shown()
    |> Steps.create_first_project()
    |> Steps.assert_first_project_defaults()
  end

  feature "creating a company requires a name", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_that_belongs_to_a_company()
    |> Steps.navigate_to_the_loby()
    |> Steps.click_on_the_add_company_button()
    |> Steps.submit_company_form_without_name()
    |> Steps.assert_company_name_is_required()
  end

  feature "creating another company remembers billing intent from query params", ctx do
    ctx
    |> Steps.given_a_user_is_logged_in_that_belongs_to_a_company()
    |> Steps.seed_active_billing_catalog()
    |> Steps.navigate_to_new_company_page_with_billing_intent()
    |> Steps.fill_in_company_form_and_submit()
    |> Steps.assert_company_is_created()
    |> Steps.assert_first_project_setup_is_shown()
    |> Steps.assert_billing_intent_is_saved()
  end
end
