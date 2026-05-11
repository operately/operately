defmodule Operately.Support.CliE2E.CreateCompanySteps do
  use Operately.Support.CliE2E

  alias Operately.People
  alias Operately.Support.CliE2E.Helpers

  @password "hello world!"

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)
    ctx = Factory.add_account(ctx, :lonely_account)

    ctx
    |> Map.put(:auth_account_key, :lonely_account)
    |> Map.put(:expected_name, ctx.lonely_account.full_name)
    |> Map.put(:expected_email, ctx.lonely_account.email)
  end

  step :use_account_with_no_companies, ctx do
    select_auth_account(ctx, :lonely_account)
  end

  step :use_account_with_existing_company, ctx do
    select_auth_account(ctx, :account)
  end

  step :use_profile, ctx, profile do
    Map.put(ctx, :profile, profile)
  end

  step :set_the_company_name_to_create, ctx, company_name do
    Map.put(ctx, :expected_company_name, company_name)
  end

  step :create_company_with_password, ctx do
    account = Map.fetch!(ctx, ctx.auth_account_key)

    result =
      run_cli(
        ctx,
        ["auth", "create-company"],
        script: [
          {"You need to authenticate to create a company. Choose a sign-in method:", "1\n"},
          {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
          {"Email:", "#{account.email}\n"},
          {"Password:", "#{@password}\n"},
          {"Company name:", "#{ctx.expected_company_name}\n"},
          {"Profile name (default: default):", "#{ctx.profile}\n"}
        ]
      )

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:expected_password_prompts, [{"Password:", @password}])
  end

  step :create_company_with_password_flags, ctx do
    account = Map.fetch!(ctx, ctx.auth_account_key)

    result =
      run_cli(ctx, [
        "auth",
        "create-company",
        "--method",
        "email-password",
        "--email",
        account.email,
        "--password",
        @password,
        "--company-name",
        ctx.expected_company_name,
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        ctx.profile
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :create_company_with_email_code, ctx do
    account = Map.fetch!(ctx, ctx.auth_account_key)

    result =
      run_cli(
        ctx,
        ["auth", "create-company"],
        script: [
          {"You need to authenticate to create a company. Choose a sign-in method:", "2\n"},
          {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
          {"Email:", "#{account.email}\n"},
          {"A verification code was sent to your email. Enter the code:", Helpers.activation_code_response(account.email)},
          {"Company name:", "#{ctx.expected_company_name}\n"},
          {"Profile name (default: default):", "#{ctx.profile}\n"}
        ]
      )

    Map.put(ctx, :cli_result, result)
  end

  step :create_company_with_email_code_flags, ctx do
    account = Map.fetch!(ctx, ctx.auth_account_key)

    result =
      run_cli(
        ctx,
        [
          "auth",
          "create-company",
          "--method",
          "emailCode",
          "--email",
          account.email,
          "--company-name",
          ctx.expected_company_name,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          ctx.profile
        ],
        script: [
          {"A verification code was sent to your email. Enter the code:", Helpers.activation_code_response(account.email)}
        ]
      )

    Map.put(ctx, :cli_result, result)
  end

  step :start_google_create_company, ctx do
    task =
      Task.async(fn ->
        run_cli(
          ctx,
          ["auth", "create-company"],
          script: [
            {"You need to authenticate to create a company. Choose a sign-in method:", "3\n"},
            {"Base URL for the Operately instance", "#{ctx.cli_base_url}\n"},
            {"Company name:", "#{ctx.expected_company_name}\n"},
            {"Profile name (default: default):", "#{ctx.profile}\n"}
          ]
        )
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :start_google_create_company_with_flags, ctx do
    task =
      Task.async(fn ->
        run_cli(ctx, [
          "auth",
          "create-company",
          "--method",
          "google",
          "--company-name",
          ctx.expected_company_name,
          "--base-url",
          ctx.cli_base_url,
          "--profile",
          ctx.profile
        ])
      end)

    Map.put(ctx, :cli_task, task)
  end

  step :create_company_with_invalid_hybrid_flags, ctx do
    result =
      run_cli(ctx, [
        "auth",
        "create-company",
        "--method",
        "google",
        "--email",
        "bad@example.com",
        "--base-url",
        ctx.cli_base_url
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :complete_pending_google_create_company, ctx do
    session = Helpers.wait_for_google_session!()
    account = Map.fetch!(ctx, ctx.auth_account_key)
    Helpers.complete_mock_google_auth!(ctx, session, account_id: account.id)
  end

  step :wait_for_google_create_company_to_finish, ctx do
    result = Task.await(ctx.cli_task, 25_000)
    Map.put(ctx, :cli_result, result)
  end

  step :assert_company_creation_succeeded, ctx do
    assert ctx.cli_result.exit_code == 0
    assert ctx.cli_result.output =~ "Logged in to #{ctx.cli_base_url}"
    assert ctx.cli_result.output =~ ctx.expected_name

    ctx
  end

  step :assert_the_password_prompt_was_masked, ctx do
    Enum.each(ctx.expected_password_prompts, fn {prompt, password} ->
      assert_password_is_masked(ctx.cli_result.output, prompt, password)
    end)

    ctx
  end

  step :assert_the_profile_was_saved, ctx do
    config = read_cli_config(ctx)
    token = get_in(config, ["profiles", ctx.profile, "token"])

    assert config["activeProfile"] == ctx.profile
    assert is_binary(token)
    assert token != ""
    assert get_in(config, ["profiles", ctx.profile, "baseUrl"]) == ctx.cli_base_url
    assert get_in(config, ["profiles", ctx.profile, "name"]) == ctx.expected_name
    assert get_in(config, ["profiles", ctx.profile, "companyName"]) == ctx.expected_company_name

    ctx
  end

  step :assert_status_command_works, ctx do
    status = run_cli(ctx, ["auth", "status", "--profile", ctx.profile])

    assert status.exit_code == 0
    assert status.output =~ "Profile: #{ctx.profile}"
    assert status.output =~ "Status: Logged in"
    assert status.output =~ "Name: #{ctx.expected_name}"
    assert status.output =~ "Company: #{ctx.expected_company_name}"
    assert status.output =~ "Base URL: #{ctx.cli_base_url}"

    ctx
  end

  step :assert_people_get_me_command_works, ctx do
    get_me = run_cli(ctx, ["people", "get_me", "--profile", ctx.profile])

    assert get_me.exit_code == 0

    payload = Jason.decode!(get_me.output)

    assert get_in(payload, ["me", "full_name"]) == ctx.expected_name
    assert get_in(payload, ["me", "email"]) == ctx.expected_email

    ctx
  end

  step :assert_the_company_was_created_for_the_account, ctx do
    account = Repo.reload!(Map.fetch!(ctx, ctx.auth_account_key))
    company = Operately.Repo.get_by!(Operately.Companies.Company, name: ctx.expected_company_name)

    assert People.get_person(account, company)

    ctx
  end

  step :assert_the_cli_output_contains, ctx, snippets do
    Enum.each(snippets, fn snippet ->
      assert ctx.cli_result.output =~ snippet
    end)

    ctx
  end

  step :assert_the_cli_output_does_not_contain, ctx, snippets do
    Enum.each(snippets, fn snippet ->
      refute ctx.cli_result.output =~ snippet
    end)

    ctx
  end

  step :assert_invalid_hybrid_flags_were_rejected, ctx do
    assert ctx.cli_result.exit_code == 2
    assert ctx.cli_result.output =~ "`--method google` cannot be combined with `--email` or `--password`."
    refute File.exists?(cli_config_path(ctx))

    ctx
  end

  defp select_auth_account(ctx, account_key) do
    account = Map.fetch!(ctx, account_key)

    ctx
    |> Map.put(:auth_account_key, account_key)
    |> Map.put(:expected_name, account.full_name)
    |> Map.put(:expected_email, account.email)
  end
end
