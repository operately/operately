defmodule Operately.Features.ApiTokensTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ApiTokensSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "navigate to API tokens page from account menu", ctx do
    ctx
    |> Steps.open_account_menu()
    |> Steps.click_api_tokens_link()
    |> Steps.assert_on_api_tokens_page()
  end

  feature "navigate to API tokens page from security page", ctx do
    ctx
    |> Steps.visit_security_page()
    |> Steps.click_manage_api_tokens_link()
    |> Steps.assert_on_api_tokens_page()
  end

  feature "create a read-only API token", ctx do
    ctx
    |> Steps.visit_api_tokens_page()
    |> Steps.open_create_token_modal()
    |> Steps.assert_read_only_toggle_is_on()
    |> Steps.click_create_token_button()
    |> Steps.assert_token_created_successfully()
    |> Steps.assert_token_value_displayed()
    |> Steps.copy_new_token()
    |> Steps.close_create_modal()
    |> Steps.assert_token_appears_in_list(index: 1, access_level: "Read-only")
  end

  feature "create a full-access API token", ctx do
    ctx
    |> Steps.visit_api_tokens_page()
    |> Steps.open_create_token_modal()
    |> Steps.toggle_read_only_to_full_access()
    |> Steps.click_create_token_button()
    |> Steps.assert_token_created_successfully()
    |> Steps.close_create_modal()
    |> Steps.assert_token_appears_in_list(index: 1, access_level: "Full access")
  end

  feature "rename an API token", ctx do
    ctx
    |> Steps.given_an_api_token_exists("token1")
    |> Steps.visit_api_tokens_page()
    |> Steps.open_token_actions_menu("token1")
    |> Steps.assert_token_name("token 1")
    |> Steps.click_update_name("token1")
    |> Steps.fill_token_name("Production API Token")
    |> Steps.save_token_name()
    |> Steps.assert_token_name("Production API Token")
  end

  feature "clear API token name", ctx do
    ctx
    |> Steps.given_an_api_token_exists_with_name(token_name: "token1", display_name: "My Token")
    |> Steps.visit_api_tokens_page()
    |> Steps.assert_token_name_displayed("My Token")
    |> Steps.open_token_actions_menu("token1")
    |> Steps.click_update_name("token1")
    |> Steps.clear_token_name()
    |> Steps.save_token_name()
    |> Steps.assert_token_name_cleared()
  end

  feature "toggle token from read-only to full-access", ctx do
    ctx
    |> Steps.given_a_read_only_token_exists("token1")
    |> Steps.visit_api_tokens_page()
    |> Steps.assert_token_access_level("Read-only")
    |> Steps.open_token_actions_menu("token1")
    |> Steps.click_toggle_access_mode("token1")
    |> Steps.assert_token_access_level("Full access")
  end

  feature "toggle token from full-access to read-only", ctx do
    ctx
    |> Steps.given_a_full_access_token_exists("token1")
    |> Steps.visit_api_tokens_page()
    |> Steps.assert_token_access_level("Full access")
    |> Steps.open_token_actions_menu("token1")
    |> Steps.click_toggle_access_mode("token1")
    |> Steps.assert_token_access_level("Read-only")
  end

  feature "delete an API token", ctx do
    ctx
    |> Steps.given_an_api_token_exists("token1")
    |> Steps.visit_api_tokens_page()
    |> Steps.assert_token_count(1)
    |> Steps.open_token_actions_menu("token1")
    |> Steps.click_delete_token("token1")
    |> Steps.confirm_delete_in_modal()
    |> Steps.assert_token_deleted()
    |> Steps.assert_token_count(0)
  end

  feature "cancel token deletion", ctx do
    ctx
    |> Steps.given_an_api_token_exists("token1")
    |> Steps.visit_api_tokens_page()
    |> Steps.assert_token_count(1)
    |> Steps.open_token_actions_menu("token1")
    |> Steps.click_delete_token("token1")
    |> Steps.cancel_delete_in_modal()
    |> Steps.assert_token_count(1)
  end

  feature "view API usage instructions", ctx do
    ctx
    |> Steps.visit_api_tokens_page()
    |> Steps.click_view_usage_instructions()
    |> Steps.assert_on_usage_page()
    |> Steps.assert_usage_page_has_base_path()
    |> Steps.assert_usage_page_has_auth_header()
    |> Steps.assert_usage_page_has_query_example()
    |> Steps.assert_usage_page_has_mutation_example()
  end

  feature "copy values from usage page", ctx do
    ctx
    |> Steps.visit_usage_page()
    |> Steps.assert_copy_buttons_present()
  end

  feature "display empty state when no tokens exist", ctx do
    ctx
    |> Steps.visit_api_tokens_page()
    |> Steps.assert_empty_state_displayed()
  end

  feature "display multiple tokens in list", ctx do
    ctx
    |> Steps.given_multiple_tokens_exist()
    |> Steps.visit_api_tokens_page()
    |> Steps.assert_token_count(3)
  end
end
