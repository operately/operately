defmodule Operately.Support.CliE2E.Spaces.UpdateToolsSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Helpers
  alias OperatelyWeb.Paths

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

    assert result.exit_code == 0, result.output

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:profile, "e2e")
    |> Map.put(:space_api_id, Paths.space_id(ctx.engineering))
  end

  step :disable_templates, ctx do
    ctx = Factory.disable_space_tool(ctx, :engineering, :templates)
    space = Repo.reload(ctx.engineering)

    assert space.tools.templates_enabled == false
    assert space.tools.tasks_enabled == false
    assert space.tools.discussions_enabled == true
    assert space.tools.resource_hub_enabled == true
    assert space.tools.kpis_enabled == false

    Map.put(ctx, :engineering, space)
  end

  step :update_templates_enabled_via_cli, ctx do
    result =
      run_cli(ctx, [
        "spaces",
        "update_tools",
        "--space-id",
        ctx.space_api_id,
        "--tools.templates-enabled",
        "true"
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_cli_succeeded, ctx do
    assert ctx.cli_result.exit_code == 0, ctx.cli_result.output
    ctx
  end

  step :assert_only_templates_changed, ctx do
    space = Repo.reload(ctx.engineering)

    assert space.tools.templates_enabled == true
    assert space.tools.tasks_enabled == false
    assert space.tools.discussions_enabled == true
    assert space.tools.resource_hub_enabled == true
    assert space.tools.kpis_enabled == false

    ctx
  end
end
