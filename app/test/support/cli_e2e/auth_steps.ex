defmodule Operately.Support.CliE2E.AuthSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Helpers

  @password "hello world!"

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)

    remember_expected_identity(ctx, ctx.creator.full_name, ctx.creator.email, ctx.company.name)
  end

  step :given_a_read_only_api_token, ctx do
    Factory.add_api_token(ctx, :api_token, :creator, read_only: true)
  end

  step :use_profile, ctx, profile do
    Map.put(ctx, :profile, profile)
  end

  step :log_in_with_token, ctx do
    result =
      run_cli(ctx, [
        "auth",
        "login",
        "--token",
        ctx.api_token,
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        ctx.profile
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_token, ctx.api_token)
  end

  step :log_in_with_password, ctx do
    result =
      run_cli(
        ctx,
        ["auth", "login", "--base-url", ctx.cli_base_url, "--profile", ctx.profile],
        script: [
          {"Enter choice (1-4):", "1\n"},
          {"Email:", "#{ctx.account.email}\n"},
          {"Password:", "#{@password}\n"},
          {"Enter choice (1-2):", "2\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [{"Password:", @password}])
  end

  step :log_in_with_email_code, ctx do
    result =
      run_cli(
        ctx,
        ["auth", "login", "--base-url", ctx.cli_base_url, "--profile", ctx.profile],
        script: [
          {"Enter choice (1-4):", "2\n"},
          {"Email:", "#{ctx.account.email}\n"},
          {"A verification code was sent to your email. Enter the code:", Helpers.activation_code_response(ctx.account.email)},
          {"Enter choice (1-2):", "2\n"}
        ]
      )

    Map.put(ctx, :cli_result, result)
  end

  step :start_google_login, ctx do
    task =
      Task.async(fn ->
        run_cli(
          ctx,
          ["auth", "login", "--base-url", ctx.cli_base_url, "--profile", ctx.profile],
          script: [
            {"Enter choice (1-4):", "3\n"},
            {"Enter choice (1-2):", "2\n"}
          ]
        )
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :complete_pending_google_login, ctx do
    session = Helpers.wait_for_google_session!()
    Helpers.complete_mock_google_auth!(ctx, session, account_id: ctx.account.id)
  end

  step :wait_for_google_login_to_finish, ctx do
    result = Task.await(ctx.cli_task, 25_000)
    Map.put(ctx, :cli_result, result)
  end

  step :log_in_with_invalid_token, ctx do
    result =
      run_cli(ctx, [
        "auth",
        "login",
        "--token",
        "invalid-token",
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        ctx.profile
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_login_succeeded, ctx do
    verify_login_succeeded(ctx)
  end

  step :assert_profile_was_saved, ctx do
    verify_profile_was_saved(ctx)
  end

  step :assert_the_password_prompts_were_masked, ctx do
    Enum.each(ctx.expected_password_prompts, fn {prompt, password} ->
      assert_password_is_masked(ctx.cli_result.output, prompt, password)
    end)

    ctx
  end

  step :assert_status_command_works, ctx do
    verify_status_command_works(ctx)
  end

  step :assert_whoami_command_works, ctx do
    verify_whoami_command_works(ctx)
  end

  step :assert_people_get_me_command_works, ctx do
    verify_people_get_me_command_works(ctx)
  end

  step :assert_invalid_token_was_rejected, ctx do
    assert ctx.cli_result.exit_code == 4
    assert ctx.cli_result.output =~ "Authentication failed: Invalid token for #{ctx.cli_base_url}"
    assert ctx.cli_result.output =~ "Please check your token and try again."

    verify_config_not_written(ctx)
  end

  defp remember_expected_identity(ctx, name, email, company_name) do
    ctx
    |> Map.put(:expected_name, name)
    |> Map.put(:expected_email, email)
    |> Map.put(:expected_company_name, company_name)
  end

  defp verify_login_succeeded(ctx) do
    assert ctx.cli_result.exit_code == 0
    assert ctx.cli_result.output =~ "Logged in to #{ctx.cli_base_url}"
    assert ctx.cli_result.output =~ ctx.expected_name

    ctx
  end

  defp verify_profile_was_saved(ctx) do
    config = read_cli_config(ctx)
    token = get_in(config, ["profiles", ctx.profile, "token"])

    assert config["activeProfile"] == ctx.profile
    assert is_binary(token)
    assert token != ""

    if ctx[:expected_token] do
      assert token == ctx.expected_token
    end

    assert get_in(config, ["profiles", ctx.profile, "baseUrl"]) == ctx.cli_base_url
    assert get_in(config, ["profiles", ctx.profile, "name"]) == ctx.expected_name
    assert get_in(config, ["profiles", ctx.profile, "companyName"]) == ctx.expected_company_name

    Map.put(ctx, :saved_profile_token, token)
  end

  defp verify_status_command_works(ctx) do
    status = run_cli(ctx, ["auth", "status", "--profile", ctx.profile])

    assert status.exit_code == 0
    assert status.output =~ "Profile: #{ctx.profile}"
    assert status.output =~ "Status: Logged in"
    assert status.output =~ "Name: #{ctx.expected_name}"
    assert status.output =~ "Company: #{ctx.expected_company_name}"
    assert status.output =~ "Base URL: #{ctx.cli_base_url}"

    ctx
  end

  defp verify_whoami_command_works(ctx) do
    whoami = run_cli(ctx, ["auth", "whoami", "--profile", ctx.profile])

    assert whoami.exit_code == 0
    assert whoami.output =~ "Logged in to #{ctx.cli_base_url} as #{ctx.expected_name}"
    assert whoami.output =~ "Email: #{ctx.expected_email}"
    assert whoami.output =~ "Profile: #{ctx.profile}"

    ctx
  end

  defp verify_people_get_me_command_works(ctx) do
    get_me = run_cli(ctx, ["people", "get_me", "--profile", ctx.profile])

    assert get_me.exit_code == 0

    payload = Jason.decode!(get_me.output)

    assert get_in(payload, ["me", "full_name"]) == ctx.expected_name
    assert get_in(payload, ["me", "email"]) == ctx.expected_email

    ctx
  end

  defp verify_config_not_written(ctx) do
    refute File.exists?(cli_config_path(ctx))
    ctx
  end
end
