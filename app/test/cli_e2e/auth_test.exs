defmodule Operately.CliE2E.AuthTest do
  use Operately.CliE2ECase

  setup ctx do
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

    config = read_cli_config(ctx)

    assert config["activeProfile"] == "e2e"
    assert get_in(config, ["profiles", "e2e", "token"]) == ctx.api_token
    assert get_in(config, ["profiles", "e2e", "baseUrl"]) == ctx.cli_base_url
    assert get_in(config, ["profiles", "e2e", "name"]) == ctx.creator.full_name
    assert get_in(config, ["profiles", "e2e", "companyName"]) == ctx.company.name

    status = run_cli(ctx, ["auth", "status", "--profile", "e2e"])

    assert status.exit_code == 0
    assert status.output =~ "Status: Logged in"
    assert status.output =~ "Name: #{ctx.creator.full_name}"
    assert status.output =~ "Company: #{ctx.company.name}"

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
end
