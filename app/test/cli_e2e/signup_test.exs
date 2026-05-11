defmodule Operately.CliE2E.SignupTest do
  use Operately.CliE2ECase

  @moduletag ownership_timeout: 60_000

  alias Operately.Support.CliE2E.SignupSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "email signup can create a company and status works", ctx do
    ctx
    |> Steps.use_profile("signup-email-create")
    |> Steps.given_a_new_email_signup_candidate(full_name: "Email Founder", email: "signup-email-founder@example.com")
    |> Steps.set_the_company_name_to_create("Email Founder Company")
    |> Steps.sign_up_with_email_and_create_a_company()
    |> Steps.assert_the_password_prompts_were_masked()
    |> Steps.assert_signup_and_login_succeeded()
    |> Steps.assert_the_signup_profile_was_saved()
    |> Steps.assert_the_signup_status_command_works()
    |> Steps.assert_the_signup_people_get_me_command_works()
  end

  test "email signup can join a company-wide invite and status works", ctx do
    ctx
    |> Steps.use_profile("signup-email-join")
    |> Steps.given_a_company_wide_invite_for_signup(company_name: "Email Invited Company")
    |> Steps.given_a_new_email_signup_candidate(full_name: "Email Joiner", email: "signup-email-joiner@example.com")
    |> Steps.sign_up_with_email_and_join_with_an_invite()
    |> Steps.assert_the_password_prompts_were_masked()
    |> Steps.assert_signup_and_login_succeeded()
    |> Steps.assert_the_signup_profile_was_saved()
    |> Steps.assert_the_signup_status_command_works()
    |> Steps.assert_the_signup_people_get_me_command_works()
    |> Steps.assert_the_new_account_was_added_to_the_invited_company()
  end

  test "email signup can be finished later without saving a profile", ctx do
    ctx
    |> Steps.given_a_new_email_signup_candidate(full_name: "Email Later", email: "signup-email-later@example.com")
    |> Steps.sign_up_with_email_and_do_this_later()
    |> Steps.assert_the_password_prompts_were_masked()
    |> Steps.assert_the_signup_can_be_finished_later()
  end

  test "email signup with flags can create a company while skipping optional prompts", ctx do
    ctx
    |> Steps.use_profile("signup-email-flags-create")
    |> Steps.given_a_new_email_signup_candidate(full_name: "Email Flag Founder", email: "signup-email-flags-create@example.com")
    |> Steps.set_the_company_name_to_create("Email Flag Founder Company")
    |> Steps.sign_up_with_email_flags_and_create_a_company()
    |> Steps.assert_the_cli_output_contains([
      "A verification code was sent to your email. Enter the code:",
      "Account created."
    ])
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to sign up?",
      "Base URL for the Operately instance",
      "Full name:",
      "Email:",
      "Password:",
      "Confirm password:",
      "What would you like to do next?",
      "Company name:",
      "Profile name (default: default):"
    ])
    |> Steps.assert_signup_and_login_succeeded()
    |> Steps.assert_the_signup_profile_was_saved()
    |> Steps.assert_the_signup_status_command_works()
    |> Steps.assert_the_signup_people_get_me_command_works()
  end

  test "email signup with flags can join while prompting only for the invite token", ctx do
    ctx
    |> Steps.use_profile("signup-email-flags-join")
    |> Steps.given_a_company_wide_invite_for_signup(company_name: "Email Flag Invited Company")
    |> Steps.given_a_new_email_signup_candidate(full_name: "Email Flag Joiner", email: "signup-email-flags-join@example.com")
    |> Steps.sign_up_with_email_flags_and_prompt_for_invite()
    |> Steps.assert_the_cli_output_contains([
      "A verification code was sent to your email. Enter the code:",
      "Invite token:"
    ])
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to sign up?",
      "Base URL for the Operately instance",
      "Full name:",
      "Email:",
      "Password:",
      "Confirm password:",
      "What would you like to do next?",
      "Profile name (default: default):"
    ])
    |> Steps.assert_signup_and_login_succeeded()
    |> Steps.assert_the_signup_profile_was_saved()
    |> Steps.assert_the_signup_status_command_works()
    |> Steps.assert_the_signup_people_get_me_command_works()
    |> Steps.assert_the_new_account_was_added_to_the_invited_company()
  end

  test "email signup with flags can be finished later without saving a profile", ctx do
    ctx
    |> Steps.given_a_new_email_signup_candidate(full_name: "Email Flags Later", email: "signup-email-flags-later@example.com")
    |> Steps.sign_up_with_email_flags_and_do_this_later()
    |> Steps.assert_the_cli_output_contains([
      "A verification code was sent to your email. Enter the code:",
      "Account created."
    ])
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to sign up?",
      "Base URL for the Operately instance",
      "Full name:",
      "Email:",
      "Password:",
      "Confirm password:",
      "What would you like to do next?",
      "Profile name (default: default):"
    ])
    |> Steps.assert_the_signup_can_be_finished_later()
  end

  test "email signup rejects existing accounts", ctx do
    ctx
    |> Steps.given_an_existing_signup_account(email: "signup-existing@example.com")
    |> Steps.sign_up_with_email_and_expect_existing_account_rejection()
    |> Steps.assert_the_password_prompts_were_masked()
    |> Steps.assert_email_signup_existing_account_was_rejected()
  end

  test "google signup can create a company and status works", ctx do
    ctx
    |> Steps.use_profile("signup-google-create")
    |> Steps.given_a_new_email_signup_candidate(full_name: "Google Founder", email: "signup-google-founder@example.com")
    |> Steps.set_the_company_name_to_create("Google Founder Company")
    |> Steps.start_google_signup_to_create_a_company()
    |> Steps.complete_google_signup_with_a_new_account()
    |> Steps.wait_for_google_signup_to_finish()
    |> Steps.assert_signup_and_login_succeeded()
    |> Steps.assert_the_signup_profile_was_saved()
    |> Steps.assert_the_signup_status_command_works()
    |> Steps.assert_the_signup_people_get_me_command_works()
  end

  test "google signup with flags can create a company while skipping optional prompts", ctx do
    ctx
    |> Steps.use_profile("signup-google-flags-create")
    |> Steps.given_a_new_email_signup_candidate(full_name: "Google Flag Founder", email: "signup-google-flags-create@example.com")
    |> Steps.set_the_company_name_to_create("Google Flag Founder Company")
    |> Steps.start_google_signup_with_flags_to_create_a_company()
    |> Steps.complete_google_signup_with_a_new_account()
    |> Steps.wait_for_google_signup_to_finish()
    |> Steps.assert_the_cli_output_contains([
      "Please sign in via Google:",
      "Browser opened automatically.",
      "Account created."
    ])
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to sign up?",
      "Base URL for the Operately instance",
      "What would you like to do next?",
      "Company name:",
      "Profile name (default: default):"
    ])
    |> Steps.assert_signup_and_login_succeeded()
    |> Steps.assert_the_signup_profile_was_saved()
    |> Steps.assert_the_signup_status_command_works()
    |> Steps.assert_the_signup_people_get_me_command_works()
  end

  test "google signup can join a company-wide invite and status works", ctx do
    ctx
    |> Steps.use_profile("signup-google-join")
    |> Steps.given_a_company_wide_invite_for_signup(company_name: "Google Invited Company")
    |> Steps.given_a_new_email_signup_candidate(full_name: "Google Joiner", email: "signup-google-joiner@example.com")
    |> Steps.start_google_signup_to_join_with_an_invite()
    |> Steps.complete_google_signup_with_a_new_account()
    |> Steps.wait_for_google_signup_to_finish()
    |> Steps.assert_signup_and_login_succeeded()
    |> Steps.assert_the_signup_profile_was_saved()
    |> Steps.assert_the_signup_status_command_works()
    |> Steps.assert_the_signup_people_get_me_command_works()
    |> Steps.assert_the_new_account_was_added_to_the_invited_company()
  end

  test "google signup can be finished later without saving a profile", ctx do
    ctx
    |> Steps.given_a_new_email_signup_candidate(full_name: "Google Later", email: "signup-google-later@example.com")
    |> Steps.start_google_signup_to_do_this_later()
    |> Steps.complete_google_signup_with_a_new_account()
    |> Steps.wait_for_google_signup_to_finish()
    |> Steps.assert_the_signup_can_be_finished_later()
  end

  test "google signup rejects existing accounts", ctx do
    ctx
    |> Steps.given_an_existing_signup_account(email: "signup-google-existing@example.com")
    |> Steps.start_google_signup_that_should_be_rejected()
    |> Steps.complete_google_signup_with_an_existing_account()
    |> Steps.wait_for_google_signup_to_finish()
    |> Steps.assert_google_signup_existing_account_was_rejected()
  end

  test "signup rejects invalid hybrid flags before starting the interactive flow", ctx do
    ctx
    |> Steps.sign_up_with_invalid_hybrid_flags()
    |> Steps.assert_the_cli_output_does_not_contain([
      "How would you like to sign up?",
      "Base URL for the Operately instance",
      "Please sign in via Google:"
    ])
    |> Steps.assert_invalid_hybrid_flags_were_rejected()
  end
end
