defmodule Operately.Support.CliE2E.Documents.HubScopeSteps do
  import ExUnit.Assertions
  import ExUnit.Callbacks, only: [on_exit: 1]
  import Operately.CliE2ECase

  alias Operately.Support.CliE2E.Helpers
  alias Operately.Support.Factory

  @one_by_one_png Base.decode64!("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+tmH0AAAAASUVORK5CYII=")

  def one_by_one_png, do: @one_by_one_png

  def setup_base(ctx) do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx =
      ctx
      |> Factory.setup()
      |> then(fn ctx -> Factory.add_space(ctx, :engineering, company_id: ctx.company.id) end)
      |> Factory.add_company_member(:subscriber)
      |> Factory.fetch_default_resource_hub(:resource_hub, :engineering)
      |> Factory.add_api_token(:api_token, :creator, read_only: false)

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
    |> Map.put(:parent_scope, :space)
    |> Map.put(:expected_resource_hub_id, ctx.resource_hub.id)
  end

  def init_project_scope(ctx) do
    ctx
    |> setup_base()
    |> Factory.add_project(:project, :engineering)
    |> Factory.fetch_default_project_resource_hub(:project_hub, :project)
    |> then(fn ctx ->
      ctx
      |> Map.put(:parent_scope, :project)
      |> Map.put(:expected_resource_hub_id, ctx.project_hub.id)
    end)
  end

  def init_goal_scope(ctx) do
    ctx
    |> setup_base()
    |> Factory.add_goal(:goal, :engineering)
    |> Factory.fetch_default_goal_resource_hub(:goal_hub, :goal)
    |> then(fn ctx ->
      ctx
      |> Map.put(:parent_scope, :goal)
      |> Map.put(:expected_resource_hub_id, ctx.goal_hub.id)
    end)
  end

  def hub_scope_flag(%{parent_scope: :project} = ctx), do: ["--project-id", ctx.project.id]
  def hub_scope_flag(%{parent_scope: :goal} = ctx), do: ["--goal-id", ctx.goal.id]
  def hub_scope_flag(ctx), do: ["--space-id", ctx.engineering.id]

  def assert_cli_success!(ctx) do
    assert ctx.cli_result.exit_code == 0, "CLI failed: #{ctx.cli_result.output}"
    ctx
  end

  def decode_cli_id(id) when is_binary(id) do
    {:ok, decoded} = OperatelyWeb.Api.Helpers.decode_id(id)
    decoded
  end

  def cli_payload(ctx) do
    Jason.decode!(ctx.cli_result.output)
  end

  def create_temp_upload_file!(extension \\ ".png") do
    path = create_temp_file!("operately-cli-upload", @one_by_one_png, extension)

    on_exit(fn ->
      File.rm(path)
    end)

    path
  end

  def collect_text(%{"text" => text}), do: [text]
  def collect_text(%{"content" => content}) when is_list(content), do: Enum.flat_map(content, &collect_text/1)
  def collect_text(list) when is_list(list), do: Enum.flat_map(list, &collect_text/1)
  def collect_text(_), do: []
end
