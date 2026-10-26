defmodule Operately.SingleHost.InstallTest do
  use ExUnit.Case, async: true

  @templates Path.expand("../../../rel/single-host/templates", __DIR__)

  setup do
    directory = Path.join(System.tmp_dir!(), "operately-install-#{System.unique_integer([:positive])}")
    File.mkdir_p!(Path.join(directory, "bin"))
    on_exit(fn -> File.rm_rf!(directory) end)

    for filename <- ["install.sh", "docker-compose.yml"] do
      contents = EEx.eval_file(Path.join(@templates, "#{filename}.eex"), version: "test")
      File.write!(Path.join(directory, filename), contents)
    end

    write_command(directory, "docker", "printf '%s\\n' \"$*\" >> docker-calls\nexit \"${DOCKER_EXIT_CODE:-0}\"")
    write_command(directory, "sleep", "exit 0")
    write_command(directory, "openssl", "printf 'test-secret-%s\\n' \"$RANDOM\"")

    {:ok, directory: directory}
  end

  test "plain HTTP uses port 80 and does not publish a TLS listener", ctx do
    assert {_, 0} = install(ctx, ["operately.example.com", "n", "", "y"])
    config = read_config(ctx)

    assert config["OPERATELY_HOST"] == "operately.example.com"
    assert config["OPERATELY_URL_SCHEME"] == "http"
    refute Map.has_key?(config, "OPERATELY_URL_PORT")
    assert config["CERT_AUTO_RENEW"] == "no"
    assert compose(ctx) =~ "80:4000"
    refute compose(ctx) =~ "443:4001"
  end

  test "managed certificates use HTTPS and retain both listeners", ctx do
    assert {_, 0} = install(ctx, ["operately.example.com", "y", "admin@example.com", "y"])
    config = read_config(ctx)

    assert config["OPERATELY_URL_SCHEME"] == "https"
    refute Map.has_key?(config, "OPERATELY_URL_PORT")
    assert config["CERT_AUTO_RENEW"] == "yes"
    assert config["CERT_DOMAIN"] == "operately.example.com"
    assert compose(ctx) =~ "80:4000"
    assert compose(ctx) =~ "443:4001"
  end

  test "proxy HTTPS uses the public scheme while keeping the upstream on HTTP", ctx do
    assert {_, 0} = install(ctx, ["operately.example.com", "n", "https", "y"])
    config = read_config(ctx)

    assert config["OPERATELY_URL_SCHEME"] == "https"
    refute Map.has_key?(config, "OPERATELY_URL_PORT")
    assert config["CERT_AUTO_RENEW"] == "no"
    assert compose(ctx) =~ "80:4000"
    refute compose(ctx) =~ "443:4001"
  end

  test "refuses to change an existing installation, including secrets", ctx do
    existing_config = "SECRET_KEY_BASE=\"original-secret\"\nCUSTOM_SETTING=\"keep-me\"\n"
    File.write!(Path.join(ctx.directory, "operately.env"), existing_config)
    original_compose = compose(ctx)

    assert {_, status} = install(ctx, ["other.example.com", "y", "admin@example.com", "y"])
    assert status != 0
    assert File.read!(Path.join(ctx.directory, "operately.env")) == existing_config
    assert compose(ctx) == original_compose
    refute File.exists?(Path.join(ctx.directory, "docker-calls"))
  end

  test "a failed Docker setup cannot cause secrets to be regenerated on rerun", ctx do
    answers = ["operately.example.com", "n", "http", "y"]
    assert {_, 1} = install(ctx, answers, [{"DOCKER_EXIT_CODE", "1"}])
    original_config = File.read!(Path.join(ctx.directory, "operately.env"))
    original_compose = compose(ctx)
    original_calls = File.read!(Path.join(ctx.directory, "docker-calls"))

    assert {_, status} = install(ctx, answers)
    assert status != 0
    assert File.read!(Path.join(ctx.directory, "operately.env")) == original_config
    assert compose(ctx) == original_compose
    assert File.read!(Path.join(ctx.directory, "docker-calls")) == original_calls
  end

  test "rejects an invalid scheme before writing files or running Docker", ctx do
    original_compose = compose(ctx)

    assert {_, status} = install(ctx, ["operately.example.com", "n", "ftp", "y"])
    assert status != 0
    refute File.exists?(Path.join(ctx.directory, "operately.env"))
    refute File.exists?(Path.join(ctx.directory, "docker-calls"))
    assert compose(ctx) == original_compose
  end

  test "cancelling leaves configuration files untouched", ctx do
    original_compose = compose(ctx)
    assert {_, 1} = install(ctx, ["operately.example.com", "n", "https", "n"])
    refute File.exists?(Path.join(ctx.directory, "operately.env"))
    assert compose(ctx) == original_compose
    refute File.exists?(Path.join(ctx.directory, "docker-calls"))
  end

  defp install(ctx, answers, env \\ []) do
    File.write!(Path.join(ctx.directory, "answers"), Enum.join(answers, "\n") <> "\n")

    System.cmd("bash", ["-c", "exec bash install.sh < answers"],
      cd: ctx.directory,
      env: [{"PATH", Path.join(ctx.directory, "bin") <> ":" <> System.fetch_env!("PATH")} | env],
      stderr_to_stdout: true
    )
  end

  defp read_config(ctx) do
    ctx.directory
    |> Path.join("operately.env")
    |> File.read!()
    |> String.split("\n", trim: true)
    |> Map.new(fn line ->
      [key, value] = String.split(line, "=", parts: 2)
      {key, String.trim(value, "\"")}
    end)
  end

  defp compose(ctx), do: File.read!(Path.join(ctx.directory, "docker-compose.yml"))

  defp write_command(directory, name, body) do
    path = Path.join([directory, "bin", name])
    File.write!(path, "#!/usr/bin/env bash\n" <> body <> "\n")
    File.chmod!(path, 0o755)
  end
end
