defmodule Operately.Support.CliE2E.SignupSteps do
  use Operately.Support.CliE2E

  alias Operately.InviteLinks
  alias Operately.People
  alias Operately.People.EmailActivationCode
  alias Operately.Support.CliE2E.Helpers

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx
  end

  step :use_profile, ctx, profile do
    Map.put(ctx, :profile, profile)
  end

  step :given_a_new_email_signup_candidate, ctx, attrs do
    full_name = Keyword.fetch!(attrs, :full_name)
    email = Keyword.fetch!(attrs, :email)
    password = Keyword.get(attrs, :password, "new password 123")

    {:ok, activation} = EmailActivationCode.create(email)

    ctx
    |> Map.put(:expected_name, full_name)
    |> Map.put(:expected_email, email)
    |> Map.put(:signup_password, password)
    |> Map.put(:activation_code, activation.code)
  end

  step :given_a_company_wide_invite_for_signup, ctx, attrs do
    inviter_name = Keyword.get(attrs, :inviter_name, :inviter_account)
    company_name = Keyword.get(attrs, :company_name, "Invited Company")

    ctx = Factory.add_account(ctx, inviter_name)
    ctx = Factory.add_company(ctx, :invited_company, Map.fetch!(ctx, inviter_name), name: company_name)

    inviter = People.get_person!(Map.fetch!(ctx, inviter_name), ctx.invited_company)

    {:ok, invite_link} =
      InviteLinks.create_invite_link(%{
        company_id: ctx.invited_company.id,
        author_id: inviter.id
      })

    ctx
    |> Map.put(:invite_link, invite_link)
    |> Map.put(:invite_token, invite_link.token)
    |> Map.put(:expected_company_name, company_name)
  end

  step :given_an_existing_signup_account, ctx, attrs do
    email = Keyword.fetch!(attrs, :email)

    ctx = Factory.add_account(ctx, :existing_account)
    account = Repo.reload!(ctx.existing_account)
    {:ok, account} = Operately.People.change_account_email(account, %{email: email}) |> Repo.update()

    Map.put(ctx, :existing_account, account)
  end

  step :set_the_company_name_to_create, ctx, company_name do
    Map.put(ctx, :expected_company_name, company_name)
  end

  step :sign_up_with_email_and_create_a_company, ctx do
    result =
      run_cli(
        ctx,
        ["auth", "signup"],
        script: [
          {"How would you like to sign up?", "1\n"},
          {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
          {"Full name:", "#{ctx.expected_name}\n"},
          {"Email:", "#{ctx.expected_email}\n"},
          {"Password:", "#{ctx.signup_password}\n"},
          {"Confirm password:", "#{ctx.signup_password}\n"},
          {"A verification code was sent to your email. Enter the code:", "#{ctx.activation_code}\n"},
          {"What would you like to do next?", "1\n"},
          {"Company name:", "#{ctx.expected_company_name}\n"},
          {"Profile name (default: default):", "#{ctx.profile}\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [
      {"Password:", ctx.signup_password},
      {"Confirm password:", ctx.signup_password}
    ])
  end

  step :sign_up_with_email_and_join_with_an_invite, ctx do
    result =
      run_cli(
        ctx,
        ["auth", "signup"],
        script: [
          {"How would you like to sign up?", "1\n"},
          {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
          {"Full name:", "#{ctx.expected_name}\n"},
          {"Email:", "#{ctx.expected_email}\n"},
          {"Password:", "#{ctx.signup_password}\n"},
          {"Confirm password:", "#{ctx.signup_password}\n"},
          {"A verification code was sent to your email. Enter the code:", "#{ctx.activation_code}\n"},
          {"What would you like to do next?", "2\n"},
          {"Invite token:", "#{ctx.invite_token}\n"},
          {"Profile name (default: default):", "#{ctx.profile}\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [
      {"Password:", ctx.signup_password},
      {"Confirm password:", ctx.signup_password}
    ])
  end

  step :sign_up_with_email_and_do_this_later, ctx do
    result =
      run_cli(
        ctx,
        ["auth", "signup"],
        script: [
          {"How would you like to sign up?", "1\n"},
          {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
          {"Full name:", "#{ctx.expected_name}\n"},
          {"Email:", "#{ctx.expected_email}\n"},
          {"Password:", "#{ctx.signup_password}\n"},
          {"Confirm password:", "#{ctx.signup_password}\n"},
          {"A verification code was sent to your email. Enter the code:", "#{ctx.activation_code}\n"},
          {"What would you like to do next?", "3\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [
      {"Password:", ctx.signup_password},
      {"Confirm password:", ctx.signup_password}
    ])
  end

  step :sign_up_with_email_and_expect_existing_account_rejection, ctx do
    password = "new password 123"

    result =
      run_cli(
        ctx,
        ["auth", "signup"],
        script: [
          {"How would you like to sign up?", "1\n"},
          {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
          {"Full name:", "Existing Signup User\n"},
          {"Email:", "#{ctx.existing_account.email}\n"},
          {"Password:", "#{password}\n"},
          {"Confirm password:", "#{password}\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [
      {"Password:", password},
      {"Confirm password:", password}
    ])
  end

  step :start_google_signup_to_create_a_company, ctx do
    task =
      Task.async(fn ->
        run_cli(
          ctx,
          ["auth", "signup"],
          script: [
            {"How would you like to sign up?", "2\n"},
            {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
            {"What would you like to do next?", "1\n"},
            {"Company name:", "#{ctx.expected_company_name}\n"},
            {"Profile name (default: default):", "#{ctx.profile}\n"}
          ]
        )
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :start_google_signup_to_join_with_an_invite, ctx do
    task =
      Task.async(fn ->
        run_cli(
          ctx,
          ["auth", "signup"],
          script: [
            {"How would you like to sign up?", "2\n"},
            {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
            {"What would you like to do next?", "2\n"},
            {"Invite token:", "#{ctx.invite_token}\n"},
            {"Profile name (default: default):", "#{ctx.profile}\n"}
          ]
        )
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :start_google_signup_to_do_this_later, ctx do
    task =
      Task.async(fn ->
        run_cli(
          ctx,
          ["auth", "signup"],
          script: [
            {"How would you like to sign up?", "2\n"},
            {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
            {"What would you like to do next?", "3\n"}
          ]
        )
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :start_google_signup_that_should_be_rejected, ctx do
    task =
      Task.async(fn ->
        run_cli(
          ctx,
          ["auth", "signup"],
          script: [
            {"How would you like to sign up?", "2\n"},
            {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"}
          ]
        )
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :complete_google_signup_with_a_new_account, ctx do
    session = Helpers.wait_for_google_session!()

    Helpers.complete_mock_google_auth!(ctx, session,
      email: ctx.expected_email,
      name: ctx.expected_name
    )
  end

  step :complete_google_signup_with_an_existing_account, ctx do
    session = Helpers.wait_for_google_session!()
    Helpers.complete_mock_google_auth!(ctx, session, [account_id: ctx.existing_account.id], :failed)
  end

  step :wait_for_google_signup_to_finish, ctx do
    result = Task.await(ctx.cli_task, 25_000)
    Map.put(ctx, :cli_result, result)
  end

  step :assert_signup_and_login_succeeded, ctx do
    assert ctx.cli_result.exit_code == 0
    assert ctx.cli_result.output =~ "Account created."
    assert ctx.cli_result.output =~ "Logged in to #{ctx.cli_base_url}"
    assert ctx.cli_result.output =~ ctx.expected_name

    ctx
  end

  step :assert_the_signup_profile_was_saved, ctx do
    config = read_cli_config(ctx)
    token = get_in(config, ["profiles", ctx.profile, "token"])

    assert config["activeProfile"] == ctx.profile
    assert is_binary(token)
    assert token != ""
    assert get_in(config, ["profiles", ctx.profile, "baseUrl"]) == ctx.cli_base_url
    assert get_in(config, ["profiles", ctx.profile, "name"]) == ctx.expected_name
    assert get_in(config, ["profiles", ctx.profile, "companyName"]) == ctx.expected_company_name

    Map.put(ctx, :saved_profile_token, token)
  end

  step :assert_the_password_prompts_were_masked, ctx do
    Enum.each(ctx.expected_password_prompts, fn {prompt, password} ->
      assert_password_is_masked(ctx.cli_result.output, prompt, password)
    end)

    ctx
  end

  step :assert_the_signup_status_command_works, ctx do
    status = run_cli(ctx, ["auth", "status", "--profile", ctx.profile])

    assert status.exit_code == 0
    assert status.output =~ "Profile: #{ctx.profile}"
    assert status.output =~ "Status: Logged in"
    assert status.output =~ "Name: #{ctx.expected_name}"
    assert status.output =~ "Company: #{ctx.expected_company_name}"
    assert status.output =~ "Base URL: #{ctx.cli_base_url}"

    ctx
  end

  step :assert_the_signup_people_get_me_command_works, ctx do
    get_me = run_cli(ctx, ["people", "get_me", "--profile", ctx.profile])

    assert get_me.exit_code == 0

    payload = Jason.decode!(get_me.output)

    assert get_in(payload, ["me", "full_name"]) == ctx.expected_name
    assert get_in(payload, ["me", "email"]) == ctx.expected_email

    ctx
  end

  step :assert_the_new_account_was_added_to_the_invited_company, ctx do
    account = People.get_account_by_email(ctx.expected_email)

    assert account
    assert People.get_person!(account, ctx.invited_company)
    assert ctx.cli_result.output =~ "Account created."
    refute ctx.cli_result.output =~ "Select a company:"

    ctx
  end

  step :assert_the_signup_can_be_finished_later, ctx do
    assert ctx.cli_result.exit_code == 0
    assert ctx.cli_result.output =~ "Account created."
    assert ctx.cli_result.output =~ "No CLI profile was saved because this account is not connected to a company yet."
    assert ctx.cli_result.output =~ "Use `operately auth create-company` later to create a company."
    assert ctx.cli_result.output =~ "Use `operately auth join` later to join an existing company."

    refute File.exists?(cli_config_path(ctx))
    assert People.get_account_by_email(ctx.expected_email)
    refute ctx.cli_result.output =~ "Profile name (default: default):"

    ctx
  end

  step :assert_google_signup_existing_account_was_rejected, ctx do
    assert ctx.cli_result.exit_code == 1
    assert ctx.cli_result.output =~ "An account already exists for this Google account."
    refute File.exists?(cli_config_path(ctx))

    ctx
  end

  step :assert_email_signup_existing_account_was_rejected, ctx do
    assert ctx.cli_result.exit_code == 1
    assert ctx.cli_result.output =~ "An account already exists for this email."
    refute File.exists?(cli_config_path(ctx))

    ctx
  end
end
