defmodule Operately.CliE2E.AuthTest do
  use Operately.CliE2ECase

  import Ecto.Query

  alias Operately.People.CliAuthSession

  setup ctx do
    previous_allow_login_with_email = Application.get_env(:operately, :allow_login_with_email)
    previous_allow_login_with_google = Application.get_env(:operately, :allow_login_with_google)

    Application.put_env(:operately, :allow_login_with_email, true)
    Application.put_env(:operately, :allow_login_with_google, true)

    on_exit(fn ->
      Application.put_env(:operately, :allow_login_with_email, previous_allow_login_with_email)
      Application.put_env(:operately, :allow_login_with_google, previous_allow_login_with_google)
    end)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_api_token(:api_token, :creator, read_only: true)

    {:ok, ctx}
  end

  test "token auth persists the profile and unlocks authenticated commands", ctx do
    login =
      run_cli(ctx, [
        "auth",
        "login",
        "--token",
        ctx.api_token,
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        "e2e"
      ])

    assert login.exit_code == 0
    assert login.output =~ "Logged in to #{ctx.cli_base_url}"
    assert login.output =~ ctx.creator.full_name

    assert_logged_in_profile(ctx, "e2e", ctx.api_token)
    assert_status_output(ctx, "e2e")

    whoami = run_cli(ctx, ["auth", "whoami", "--profile", "e2e"])

    assert whoami.exit_code == 0
    assert whoami.output =~ "Logged in to #{ctx.cli_base_url} as #{ctx.creator.full_name}"
    assert whoami.output =~ "Email: #{ctx.creator.email}"
    assert whoami.output =~ "Profile: e2e"

    get_me = run_cli(ctx, ["people", "get_me", "--profile", "e2e"])

    assert get_me.exit_code == 0

    payload = Jason.decode!(get_me.output)

    assert get_in(payload, ["me", "email"]) == ctx.creator.email
    assert get_in(payload, ["me", "full_name"]) == ctx.creator.full_name
  end

  @tag ownership_timeout: 60_000
  test "password auth persists the profile and status works", ctx do
    login =
      run_cli(
        ctx,
        ["auth", "login", "--base-url", ctx.cli_base_url, "--profile", "password-e2e"],
        script: [
          {"Enter choice (1-3):", "1\n"},
          {"Email:", "#{ctx.account.email}\n"},
          {"Password:", "hello world!\n"},
          {"Enter choice (1-2):", "2\n"}
        ]
      )

    assert login.exit_code == 0
    assert login.output =~ "Logged in to #{ctx.cli_base_url}"
    assert login.output =~ ctx.creator.full_name

    config = read_cli_config(ctx)
    token = get_in(config, ["profiles", "password-e2e", "token"])

    assert is_binary(token)
    assert token != ""

    assert_logged_in_profile(ctx, "password-e2e", token)
    assert_status_output(ctx, "password-e2e")
  end

  @tag ownership_timeout: 60_000
  test "google auth persists the profile and status works", ctx do
    login_task =
      Task.async(fn ->
        run_cli(
          ctx,
          ["auth", "login", "--base-url", ctx.cli_base_url, "--profile", "google-e2e"],
          script: [
            {"Enter choice (1-3):", "2\n"},
            {"Enter choice (1-2):", "2\n"}
          ]
        )
      end)

    session = wait_for_google_session!()
    complete_mock_google_login!(ctx, session, ctx.account.id)

    login = Task.await(login_task, 25_000)

    assert login.exit_code == 0
    assert login.output =~ "Please sign in via Google:"
    assert login.output =~ "Logged in to #{ctx.cli_base_url}"
    assert login.output =~ ctx.creator.full_name

    config = read_cli_config(ctx)
    token = get_in(config, ["profiles", "google-e2e", "token"])

    assert is_binary(token)
    assert token != ""

    assert_logged_in_profile(ctx, "google-e2e", token)
    assert_status_output(ctx, "google-e2e")
  end

  test "token auth rejects invalid tokens", ctx do
    result =
      run_cli(ctx, [
        "auth",
        "login",
        "--token",
        "invalid-token",
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        "e2e"
      ])

    assert result.exit_code == 4
    assert result.output =~ "Authentication failed: Invalid token for #{ctx.cli_base_url}"
    assert result.output =~ "Please check your token and try again."

    refute File.exists?(cli_config_path(ctx))
  end

  defp assert_logged_in_profile(ctx, profile, token) do
    config = read_cli_config(ctx)

    assert config["activeProfile"] == profile
    assert get_in(config, ["profiles", profile, "token"]) == token
    assert get_in(config, ["profiles", profile, "baseUrl"]) == ctx.cli_base_url
    assert get_in(config, ["profiles", profile, "name"]) == ctx.creator.full_name
    assert get_in(config, ["profiles", profile, "companyName"]) == ctx.company.name
  end

  defp assert_status_output(ctx, profile) do
    status = run_cli(ctx, ["auth", "status", "--profile", profile])

    assert status.exit_code == 0
    assert status.output =~ "Profile: #{profile}"
    assert status.output =~ "Status: Logged in"
    assert status.output =~ "Name: #{ctx.creator.full_name}"
    assert status.output =~ "Company: #{ctx.company.name}"
    assert status.output =~ "Base URL: #{ctx.cli_base_url}"
  end

  defp wait_for_google_session!(timeout_ms \\ 5_000) do
    deadline = System.monotonic_time(:millisecond) + timeout_ms
    do_wait_for_google_session(deadline)
  end

  defp do_wait_for_google_session(deadline) do
    session =
      from(s in CliAuthSession,
        where: s.auth_method == :google,
        order_by: [desc: s.inserted_at],
        limit: 1
      )
      |> Repo.one()

    cond do
      session && session.status == :pending ->
        session

      System.monotonic_time(:millisecond) >= deadline ->
        flunk("Timed out waiting for the CLI to create a pending Google auth session")

      true ->
        Process.sleep(100)
        do_wait_for_google_session(deadline)
    end
  end

  defp complete_mock_google_login!(ctx, session, account_id) do
    # Follow the same /cli-login redirect the CLI prints, but swap Google for test_google.
    login_response = browser_get(ctx, "/cli-login/#{session.id}?account_id=#{account_id}")

    assert login_response.status == 302
    assert login_response.headers["location"] =~ "/accounts/auth/test_google"

    auth_response = browser_get(ctx, login_response.headers["location"])

    assert auth_response.status == 302
    assert auth_response.headers["location"] == "/cli-login/#{session.id}/success"

    session = Repo.get!(CliAuthSession, session.id)
    assert session.status == :authenticated
  end
end
