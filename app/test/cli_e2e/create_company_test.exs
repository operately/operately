defmodule Operately.CliE2E.CreateCompanyTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.CreateCompanySteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  @tag ownership_timeout: 60_000
  test "password auth creates a company for an existing account with no companies", ctx do
    ctx
    |> Steps.use_account_with_no_companies()
    |> Steps.use_profile("create-company-password")
    |> Steps.set_the_company_name_to_create("Password Bootstrap Company")
    |> Steps.create_company_with_password()
    |> Steps.assert_the_password_prompt_was_masked()
    |> Steps.assert_company_creation_succeeded()
    |> Steps.assert_the_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
    |> Steps.assert_the_company_was_created_for_the_account()
  end

  @tag ownership_timeout: 60_000
  test "google auth creates a company for an existing account with no companies", ctx do
    ctx
    |> Steps.use_account_with_no_companies()
    |> Steps.use_profile("create-company-google")
    |> Steps.set_the_company_name_to_create("Google Bootstrap Company")
    |> Steps.start_google_create_company()
    |> Steps.complete_pending_google_create_company()
    |> Steps.wait_for_google_create_company_to_finish()
    |> Steps.assert_company_creation_succeeded()
    |> Steps.assert_the_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
    |> Steps.assert_the_company_was_created_for_the_account()
  end

  @tag ownership_timeout: 60_000
  test "email-code auth creates a company for an existing account with no companies", ctx do
    ctx
    |> Steps.use_account_with_no_companies()
    |> Steps.use_profile("create-company-email-code")
    |> Steps.set_the_company_name_to_create("Email Code Bootstrap Company")
    |> Steps.create_company_with_email_code()
    |> Steps.assert_company_creation_succeeded()
    |> Steps.assert_the_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
    |> Steps.assert_the_company_was_created_for_the_account()
  end

  @tag ownership_timeout: 60_000
  test "password auth creates another company for an account that already has one", ctx do
    ctx
    |> Steps.use_account_with_existing_company()
    |> Steps.use_profile("create-company-password-existing")
    |> Steps.set_the_company_name_to_create("Second Password Company")
    |> Steps.create_company_with_password()
    |> Steps.assert_the_password_prompt_was_masked()
    |> Steps.assert_company_creation_succeeded()
    |> Steps.assert_the_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
    |> Steps.assert_the_company_was_created_for_the_account()
  end

  @tag ownership_timeout: 60_000
  test "google auth creates another company for an account that already has one", ctx do
    ctx
    |> Steps.use_account_with_existing_company()
    |> Steps.use_profile("create-company-google-existing")
    |> Steps.set_the_company_name_to_create("Second Google Company")
    |> Steps.start_google_create_company()
    |> Steps.complete_pending_google_create_company()
    |> Steps.wait_for_google_create_company_to_finish()
    |> Steps.assert_company_creation_succeeded()
    |> Steps.assert_the_profile_was_saved()
    |> Steps.assert_status_command_works()
    |> Steps.assert_people_get_me_command_works()
    |> Steps.assert_the_company_was_created_for_the_account()
  end
end
