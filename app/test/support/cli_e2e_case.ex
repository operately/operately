defmodule Operately.CliE2ECase do
  use ExUnit.CaseTemplate

  @base_url "http://localhost:4002"

  using do
    quote do
      use ExUnit.Case, async: false

      alias Operately.Repo
      alias Operately.Support.Factory

      import Operately.CliE2ECase
    end
  end

  setup tags do
    owner = Ecto.Adapters.SQL.Sandbox.start_owner!(Operately.Repo, ownership_timeout: tags[:ownership_timeout] || 30_000)

    on_exit(fn ->
      Ecto.Adapters.SQL.Sandbox.stop_owner(owner)
    end)

    assert_cli_built!()

    cli_home = create_cli_home!()

    on_exit(fn ->
      File.rm_rf(cli_home)
    end)

    cli_user_agent =
      Operately.Repo
      |> Phoenix.Ecto.SQL.Sandbox.metadata_for(owner)
      |> Phoenix.Ecto.SQL.Sandbox.encode_metadata()

    {:ok,
     cli_base_url: @base_url,
     cli_home: cli_home,
     cli_user_agent: cli_user_agent}
  end

  def run_cli(ctx, args, opts \\ []) when is_list(args) do
    env =
      [
        {"HOME", ctx.cli_home},
        {"OPERATELY_API_TOKEN", ""},
        {"OPERATELY_BASE_URL", Keyword.get(opts, :base_url, ctx.cli_base_url)},
        {"OPERATELY_PROFILE", ""},
        {"OPERATELY_E2E_USER_AGENT", ctx.cli_user_agent}
      ] ++ Keyword.get(opts, :env, [])

    {output, exit_code} =
      System.cmd("node", [cli_entrypoint() | args],
        cd: app_root(),
        env: env,
        stderr_to_stdout: true
      )

    %{exit_code: exit_code, output: output}
  end

  def read_cli_config(ctx) do
    ctx
    |> cli_config_path()
    |> File.read!()
    |> Jason.decode!()
  end

  def cli_config_path(ctx) do
    Path.join([ctx.cli_home, ".operately", "config.json"])
  end

  defp create_cli_home! do
    path = Path.join(System.tmp_dir!(), "operately-cli-e2e-#{System.unique_integer([:positive])}")
    File.mkdir_p!(path)
    path
  end

  defp cli_entrypoint do
    Path.join(repo_root(), "cli/dist/index.js")
  end

  defp assert_cli_built! do
    unless File.exists?(cli_entrypoint()) do
      raise """
      CLI build artifact not found at #{cli_entrypoint()}.
      Run `make cli.build` or `make cli.test.e2e` before executing CLI E2E tests.
      """
    end
  end

  defp app_root do
    Path.expand("../..", __DIR__)
  end

  defp repo_root do
    Path.expand("..", app_root())
  end
end
