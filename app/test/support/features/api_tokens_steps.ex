defmodule Operately.Support.Features.ApiTokensSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("api-tokens")
    |> Factory.log_in_person(:creator)
  end

  defp get_token_from_context(ctx, token_name) do
    raw_token = Map.fetch!(ctx, token_name)
    token_hash = Operately.People.ApiToken.hash_token(raw_token)
    Operately.Repo.get_by!(Operately.People.ApiToken, token_hash: token_hash)
  end

  step :open_account_menu, ctx do
    ctx |> UI.click(testid: "account-menu")
  end

  step :click_api_tokens_link, ctx do
    ctx |> UI.click(testid: "api-tokens-link")
  end

  step :visit_security_page, ctx do
    ctx |> UI.visit(Paths.account_security_path(ctx.company))
  end

  step :click_manage_api_tokens_link, ctx do
    ctx |> UI.click(testid: "manage-api-tokens-link")
  end

  step :visit_api_tokens_page, ctx do
    ctx |> UI.visit(Paths.account_api_tokens_path(ctx.company))
  end

  step :assert_on_api_tokens_page, ctx do
    ctx |> UI.assert_has(testid: "account-api-tokens-page")
  end

  step :open_create_token_modal, ctx do
    ctx |> UI.click(testid: "open-create-api-token-modal")
  end

  step :assert_read_only_toggle_is_on, ctx do
    ctx
    |> UI.assert_has(testid: "create-api-token-modal")
    |> UI.assert_text("Read-only (queries only)")
  end

  step :toggle_read_only_to_full_access, ctx do
    ctx |> UI.click(testid: "new-api-token-read-only-toggle")
  end

  step :click_create_token_button, ctx do
    ctx |> UI.click(testid: "create-api-token-button")
  end

  step :assert_token_created_successfully, ctx do
    ctx
    |> UI.sleep(500)
    |> UI.assert_has(testid: "new-api-token-card")
  end

  step :assert_token_value_displayed, ctx do
    ctx |> UI.assert_has(testid: "new-api-token-value")
  end

  step :copy_new_token, ctx do
    ctx |> UI.click(testid: "copy-new-api-token")
  end

  step :close_create_modal, ctx do
    ctx |> UI.click(testid: "close-create-api-token-modal")
  end

  step :assert_token_appears_in_list, ctx, index: index, access_level: access_level do
    ctx
    |> UI.assert_text("token #{index}")
    |> UI.assert_text(access_level)
  end

  step :given_an_api_token_exists, ctx, token_name do
    ctx |> Factory.add_api_token(token_name, :creator, read_only: true)
  end

  step :given_an_api_token_exists_with_name, ctx, token_name: token_name, display_name: display_name do
    ctx |> Factory.add_api_token(token_name, :creator, read_only: true, name: display_name)
  end

  step :given_a_read_only_token_exists, ctx, token_name do
    ctx |> Factory.add_api_token(token_name, :creator, read_only: true)
  end

  step :given_a_full_access_token_exists, ctx, token_name do
    ctx |> Factory.add_api_token(token_name, :creator, read_only: false)
  end

  step :given_multiple_tokens_exist, ctx do
    ctx
    |> Factory.add_api_token(:token1, :creator, read_only: true)
    |> Factory.add_api_token(:token2, :creator, read_only: false)
    |> Factory.add_api_token(:token3, :creator, read_only: true)
  end

  step :open_token_actions_menu, ctx, token_name do
    token = get_token_from_context(ctx, token_name)
    testid = UI.testid(["api-token-actions-menu", Paths.token_id(token)])

    ctx |> UI.click(testid: testid)
  end

  step :click_update_name, ctx, token_name do
    token = get_token_from_context(ctx, token_name)
    testid = UI.testid(["update-api-token-name", Paths.token_id(token)])

    ctx |> UI.click(testid: testid)
  end

  step :fill_token_name, ctx, name do
    ctx
    |> UI.assert_has(testid: "update-api-token-name-modal")
    |> UI.fill(testid: "update-api-token-name-input", with: name)
  end

  step :clear_token_name, ctx do
    ctx
    |> UI.assert_has(testid: "update-api-token-name-modal")
    |> UI.fill(testid: "update-api-token-name-input", with: "  ")
  end

  step :save_token_name, ctx do
    ctx |> UI.click(testid: "update-api-token-name-save")
  end

  step :assert_token_name, ctx, name do
    ctx
    |> UI.sleep(500)
    |> UI.assert_text(name)
  end

  step :assert_token_name_displayed, ctx, name do
    ctx |> UI.assert_text(name)
  end

  step :assert_token_name_cleared, ctx do
    ctx
    |> UI.sleep(500)
    |> UI.assert_text("token 1")
  end

  step :assert_token_access_level, ctx, access_level do
    ctx |> UI.assert_text(access_level)
  end

  step :click_toggle_access_mode, ctx, token_name do
    token = get_token_from_context(ctx, token_name)

    ctx
    |> UI.click(testid: UI.testid(["api-token-mode-toggle", Paths.token_id(token)]))
    |> UI.sleep(500)
  end

  step :click_delete_token, ctx, token_name do
    token = get_token_from_context(ctx, token_name)

    ctx |> UI.click(testid: UI.testid(["delete-api-token", Paths.token_id(token)]))
  end

  step :confirm_delete_in_modal, ctx do
    ctx
    |> UI.assert_has(testid: "delete-api-token-modal")
    |> UI.click(testid: "delete-api-token-confirm")
    |> UI.sleep(500)
  end

  step :cancel_delete_in_modal, ctx do
    ctx
    |> UI.assert_has(testid: "delete-api-token-modal")
    |> UI.click(testid: "delete-api-token-cancel")
  end

  step :assert_token_deleted, ctx do
    ctx |> UI.assert_text("No API tokens created yet.")
  end

  step :assert_token_count, ctx, count do
    if count == 0 do
      ctx |> UI.assert_text("No API tokens created yet.")
    else
      ctx |> UI.assert_text("token #{count}")
    end
  end

  step :click_view_usage_instructions, ctx do
    ctx |> UI.click(testid: "view-api-token-usage")
  end

  step :visit_usage_page, ctx do
    ctx |> UI.visit(Paths.account_api_tokens_usage_path(ctx.company))
  end

  step :assert_on_usage_page, ctx do
    ctx |> UI.assert_has(testid: "account-api-tokens-usage-page")
  end

  step :assert_usage_page_has_base_path, ctx do
    ctx
    |> UI.assert_text("/api/external/v1")
    |> UI.assert_has(testid: "copy-base-path")
  end

  step :assert_usage_page_has_auth_header, ctx do
    ctx
    |> UI.assert_text("Authorization: Bearer <token>")
    |> UI.assert_has(testid: "copy-auth-header")
  end

  step :assert_usage_page_has_query_example, ctx do
    ctx
    |> UI.assert_text("Query Example (GET)")
    |> UI.assert_has(testid: "copy-query-snippet")
  end

  step :assert_usage_page_has_mutation_example, ctx do
    ctx
    |> UI.assert_text("Mutation Example (POST)")
    |> UI.assert_has(testid: "copy-mutation-snippet")
  end

  step :assert_copy_buttons_present, ctx do
    ctx
    |> UI.assert_has(testid: "copy-base-path")
    |> UI.assert_has(testid: "copy-auth-header")
    |> UI.assert_has(testid: "copy-query-snippet")
    |> UI.assert_has(testid: "copy-mutation-snippet")
  end

  step :assert_empty_state_displayed, ctx do
    ctx |> UI.assert_text("No API tokens created yet.")
  end
end
