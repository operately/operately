defmodule Operately.Support.CliE2E.Goals.CreateSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Helpers

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)
    ctx = Factory.add_space(ctx, :engineering, company_id: ctx.company.id)
    ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: false)

    result =
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

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:profile, "e2e")
  end

  step :create_goal_with_name, ctx, name do
    result =
      run_cli(ctx, [
        "goals",
        "create",
        "--space-id",
        ctx.engineering.id,
        "--name",
        name,
        "--anonymous-access-level",
        "0",
        "--company-access-level",
        "0",
        "--space-access-level",
        "100"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:goal_name, name)
  end

  step :create_goal_with_description, ctx, params do
    name = params[:name]
    description = params[:description]

    result =
      run_cli(ctx, [
        "goals",
        "create",
        "--space-id",
        ctx.engineering.id,
        "--name",
        name,
        "--description",
        description,
        "--anonymous-access-level",
        "0",
        "--company-access-level",
        "0",
        "--space-access-level",
        "100"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:goal_name, name)
    |> Map.put(:goal_description, description)
  end

  step :assert_goal_created_successfully, ctx do
    assert ctx.cli_result.exit_code == 0
    assert ctx.cli_result.output =~ "\"name\": \"#{ctx.goal_name}\""

    payload = Jason.decode!(ctx.cli_result.output)
    goal_id = get_in(payload, ["goal", "id"])

    assert is_binary(goal_id)
    assert String.length(goal_id) > 0

    Map.put(ctx, :created_goal_id, goal_id)
  end

  step :assert_goal_has_description, ctx do
    assert ctx.cli_result.exit_code == 0

    payload = Jason.decode!(ctx.cli_result.output)
    goal = payload["goal"]

    assert is_map(goal)
    assert goal["name"] == ctx.goal_name

    ctx
  end

  step :assert_goal_creation_failed, ctx do
    assert ctx.cli_result.exit_code != 0
    ctx
  end
end
