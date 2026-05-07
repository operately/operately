defmodule Operately.CliE2E.JoinTest do
  use Operately.CliE2ECase

  @moduletag ownership_timeout: 60_000

  alias Operately.Support.CliE2E.JoinSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "join rejects invalid invite tokens", ctx do
    ctx
    |> Steps.use_profile("join-invalid")
    |> Steps.given_an_invalid_invite_token()
    |> Steps.run_join_with_invalid_invite_token()
    |> Steps.assert_invalid_invite_token_was_rejected()
  end

  test "personal invite joins a returning member with password and status works", ctx do
    ctx
    |> Steps.use_profile("personal-password-returning")
    |> Steps.given_a_returning_personal_invitee()
    |> Steps.given_a_personal_invite_for_the_invitee()
    |> Steps.join_personal_invite_as_a_returning_member_with_password()
    |> Steps.assert_the_password_prompts_were_masked()
    |> Steps.assert_join_login_succeeded()
    |> Steps.assert_the_cli_announces_the_personal_invitee_email()
    |> Steps.assert_the_personal_invite_was_consumed()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
  end

  test "personal invite lets a first-time member set a password and status works", ctx do
    ctx
    |> Steps.use_profile("personal-password-first-time")
    |> Steps.given_a_first_time_personal_invitee()
    |> Steps.given_a_personal_invite_for_the_invitee()
    |> Steps.join_personal_invite_as_a_first_time_member_with_password()
    |> Steps.assert_the_password_prompts_were_masked()
    |> Steps.assert_join_login_succeeded()
    |> Steps.assert_the_personal_invite_was_consumed()
    |> Steps.assert_the_invitee_account_was_marked_as_used()
    |> Steps.assert_the_invitee_can_use_the_new_password()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
  end

  test "personal invite joins via google and status works", ctx do
    ctx
    |> Steps.use_profile("personal-google")
    |> Steps.given_a_google_personal_invitee()
    |> Steps.given_a_personal_invite_for_the_invitee()
    |> Steps.start_personal_invite_google_join()
    |> Steps.complete_personal_invite_google_join()
    |> Steps.wait_for_join_to_finish()
    |> Steps.assert_join_login_succeeded()
    |> Steps.assert_the_personal_invite_was_consumed()
    |> Steps.assert_the_invitee_account_was_marked_as_used()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
  end

  test "company-wide invite joins via password, auto-selects the invited company, and status works", ctx do
    ctx
    |> Steps.use_profile("company-password")
    |> Steps.given_a_company_wide_invite_for_another_company()
    |> Steps.join_company_wide_invite_with_password()
    |> Steps.assert_the_password_prompts_were_masked()
    |> Steps.assert_join_login_succeeded()
    |> Steps.assert_the_company_selection_prompt_was_skipped()
    |> Steps.assert_the_company_wide_invite_was_used()
    |> Steps.assert_the_existing_account_was_added_to_the_invited_company()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
  end

  test "company-wide invite joins a new google account and status works", ctx do
    ctx
    |> Steps.use_profile("company-google")
    |> Steps.given_a_company_wide_google_invite_for_another_company()
    |> Steps.start_company_wide_google_join_for_a_new_account()
    |> Steps.complete_company_wide_google_join_for_a_new_account()
    |> Steps.wait_for_join_to_finish()
    |> Steps.assert_join_login_succeeded()
    |> Steps.assert_the_company_wide_invite_was_used()
    |> Steps.assert_the_new_google_account_was_added_to_the_invited_company()
    |> Steps.assert_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
  end
end
