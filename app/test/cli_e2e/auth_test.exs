defmodule Operately.CliE2E.AuthTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.AuthSteps, as: Steps

  setup ctx do
    {:ok,
     ctx
     |> Steps.setup()
     |> Steps.given_a_read_only_api_token()}
  end

  test "token auth persists the profile and unlocks authenticated commands", ctx do
    ctx
    |> Steps.use_profile("e2e")
    |> Steps.log_in_with_token()
    |> Steps.assert_login_succeeded()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_whoami_command_works()
    |> Steps.assert_people_get_me_command_works()
  end

  @tag ownership_timeout: 60_000
  test "password auth persists the profile and status works", ctx do
    ctx
    |> Steps.use_profile("password-e2e")
    |> Steps.log_in_with_password()
    |> Steps.assert_the_password_prompts_were_masked()
    |> Steps.assert_login_succeeded()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
  end

  @tag ownership_timeout: 60_000
  test "password auth with flags skips bootstrap prompts and can target a company by name", ctx do
    ctx
    |> Steps.given_a_second_company_for_the_same_account()
    |> Steps.expect_the_second_company_after_login()
    |> Steps.use_profile("password-flags-e2e")
    |> Steps.log_in_with_password_flags()
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to authenticate?",
      "Base URL for the Operately instance",
      "Profile name (default: default):",
      "Email:",
      "Password:",
      "Select a company:",
      "Select access mode:"
    ])
    |> Steps.assert_login_succeeded()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
  end

  @tag ownership_timeout: 60_000
  test "google auth persists the profile and status works", ctx do
    ctx
    |> Steps.use_profile("google-e2e")
    |> Steps.start_google_login()
    |> Steps.complete_pending_google_login()
    |> Steps.wait_for_google_login_to_finish()
    |> Steps.assert_login_succeeded()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
  end

  @tag ownership_timeout: 60_000
  test "google auth with flags only requires browser confirmation", ctx do
    ctx
    |> Steps.use_profile("google-flags-e2e")
    |> Steps.start_google_login_with_flags()
    |> Steps.complete_pending_google_login()
    |> Steps.wait_for_google_login_to_finish()
    |> Steps.assert_the_cli_output_contains([
      "Please sign in via Google:",
      "Browser opened automatically."
    ])
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to authenticate?",
      "Base URL for the Operately instance",
      "Profile name (default: default):",
      "Select a company:",
      "Select access mode:"
    ])
    |> Steps.assert_login_succeeded()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
  end

  @tag ownership_timeout: 60_000
  test "email-code auth persists the profile and status works", ctx do
    ctx
    |> Steps.use_profile("email-code-e2e")
    |> Steps.log_in_with_email_code()
    |> Steps.assert_login_succeeded()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
  end

  @tag ownership_timeout: 60_000
  test "email-code auth with flags only leaves the verification code prompt", ctx do
    ctx
    |> Steps.use_profile("email-code-flags-e2e")
    |> Steps.log_in_with_email_code_flags()
    |> Steps.assert_the_cli_output_contains([
      "A verification code was sent to your email. Enter the code:"
    ])
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to authenticate?",
      "Base URL for the Operately instance",
      "Profile name (default: default):",
      "Email:",
      "Select a company:",
      "Select access mode:"
    ])
    |> Steps.assert_login_succeeded()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
  end

  test "token auth rejects invalid tokens", ctx do
    ctx
    |> Steps.use_profile("e2e")
    |> Steps.log_in_with_invalid_token()
    |> Steps.assert_invalid_token_was_rejected()
  end

  test "login rejects invalid hybrid flag combinations before starting the interactive flow", ctx do
    ctx
    |> Steps.use_profile("invalid-flags-e2e")
    |> Steps.log_in_with_invalid_hybrid_flags()
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to authenticate?",
      "Base URL for the Operately instance",
      "Email:"
    ])
    |> Steps.assert_invalid_hybrid_flags_were_rejected()
  end
end
