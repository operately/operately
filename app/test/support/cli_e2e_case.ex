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

    {output, exit_code} = run_cli_command(args, env, Keyword.get(opts, :input), Keyword.get(opts, :script))

    %{exit_code: exit_code, output: output}
  end

  def browser_get(ctx, path_or_url, opts \\ []) do
    :inets.start()

    url = absolute_url(ctx.cli_base_url, path_or_url)

    # Reuse the sandbox header so direct HTTP requests can see the test transaction.
    headers = [
      {~c"user-agent", String.to_charlist(ctx.cli_user_agent)}
    ]

    case :httpc.request(:get, {String.to_charlist(url), headers}, [autoredirect: Keyword.get(opts, :follow_redirects, false)], [body_format: :binary]) do
      {:ok, {{_version, status, _reason}, headers, body}} ->
        %{
          status: status,
          headers: normalize_headers(headers),
          body: body
        }

      {:error, reason} ->
        raise "Browser request failed for #{url}: #{inspect(reason)}"
    end
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

  defp run_cli_command(args, env, nil, nil) do
    System.cmd("node", [cli_entrypoint() | args],
      cd: app_root(),
      env: env,
      stderr_to_stdout: true
    )
  end

  defp run_cli_command(args, env, _input, script) when is_list(script) do
    port = open_cli_port(args, env)

    # Feed each response only after the CLI prints the matching prompt.
    collect_port_output(port, "", normalize_script_steps(script))
  end

  defp run_cli_command(args, env, input, nil) when is_binary(input) or is_list(input) do
    input_chunks = normalize_input_chunks(input)

    port = open_cli_port(args, env)

    Enum.each(input_chunks, fn {delay_ms, chunk} ->
      if delay_ms > 0, do: Process.sleep(delay_ms)
      Port.command(port, chunk)
    end)

    collect_port_output(port, "", [])
  end

  defp open_cli_port(args, env) do
    Port.open({:spawn_executable, String.to_charlist(System.find_executable("node") || "node")}, [
      :binary,
      :exit_status,
      :stderr_to_stdout,
      :use_stdio,
      {:cd, String.to_charlist(app_root())},
      {:env, Enum.map(env, fn {key, value} -> {String.to_charlist(key), String.to_charlist(value)} end)},
      {:args, Enum.map([cli_entrypoint() | args], &String.to_charlist/1)}
    ])
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

  defp absolute_url(base_url, path_or_url) do
    uri = URI.parse(path_or_url)

    if uri.scheme do
      path_or_url
    else
      URI.merge(base_url, path_or_url) |> to_string()
    end
  end

  defp normalize_headers(headers) do
    Map.new(headers, fn {name, value} ->
      {name |> List.to_string() |> String.downcase(), List.to_string(value)}
    end)
  end

  defp normalize_input_chunks(input) when is_binary(input), do: [{0, input}]

  defp normalize_input_chunks(input) when is_list(input) do
    Enum.map(input, fn
      {delay_ms, chunk} when is_integer(delay_ms) and is_binary(chunk) ->
        {delay_ms, chunk}

      chunk when is_binary(chunk) ->
        {0, chunk}
    end)
  end

  defp normalize_script_steps(script) do
    Enum.map(script, fn {prompt, response} -> {prompt, response} end)
  end

  defp collect_port_output(port, output, script_steps) do
    receive do
      {^port, {:data, data}} ->
        output = output <> data
        script_steps = maybe_send_script_steps(port, output, script_steps)
        collect_port_output(port, output, script_steps)

      {^port, {:exit_status, exit_code}} ->
        {output, exit_code}
    end
  end

  defp maybe_send_script_steps(port, output, [{prompt, response} | rest]) do
    if String.contains?(output, prompt) do
      Port.command(port, response)
      maybe_send_script_steps(port, output, rest)
    else
      [{prompt, response} | rest]
    end
  end

  defp maybe_send_script_steps(_port, _output, []), do: []
end
