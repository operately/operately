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

  test "token auth rejects invalid tokens", ctx do
    ctx
    |> Steps.use_profile("e2e")
    |> Steps.log_in_with_invalid_token()
    |> Steps.assert_invalid_token_was_rejected()
  end
end
