defmodule Operately.Support.CliE2E.Projects.UpdateParentGoalSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Helpers

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)
    ctx = Factory.add_space(ctx, :engineering, company_id: ctx.company.id)
    ctx = Factory.add_project(ctx, :project, :engineering)
    ctx = Factory.add_goal(ctx, :goal, :engineering)
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

  step :update_project_parent_goal, ctx, goal_key do
    goal = Map.fetch!(ctx, goal_key)

    result =
      run_cli(ctx, [
        "projects",
        "update_parent_goal",
        "--project-id",
        ctx.project.id,
        "--goal-id",
        goal.id
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:updated_goal_key, goal_key)
  end

  step :clear_project_parent_goal, ctx do
    result =
      run_cli(ctx, [
        "projects",
        "update_parent_goal",
        "--project-id",
        ctx.project.id,
        "--goal-id",
        "null"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:updated_goal_key, nil)
  end

  step :assert_parent_goal_updated_successfully, ctx do
    assert ctx.cli_result.exit_code == 0
    assert ctx.cli_result.output =~ "\"success\": true"

    payload = Jason.decode!(ctx.cli_result.output)
    assert payload["success"] == true

    ctx
  end

  step :assert_parent_goal_update_failed, ctx do
    assert ctx.cli_result.exit_code != 0
    ctx
  end
end
