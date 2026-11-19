defmodule Operately.SingleHost.UpdateTest do
  use ExUnit.Case, async: true

  @templates Path.expand("../../../rel/single-host/templates", __DIR__)
  @stop "compose stop --timeout 60 app"
  @migrate "compose run --rm app sh -c /opt/operately/bin/migrate"

  setup do
    directory = Path.join(System.tmp_dir!(), "operately-update-#{System.unique_integer([:positive])}")
    release_directory = Path.join(directory, "release")
    File.mkdir_p!(Path.join(directory, "bin"))
    File.mkdir_p!(Path.join(release_directory, "operately"))
    on_exit(fn -> File.rm_rf!(directory) end)

    write_release(directory, "old")
    write_release(Path.join(release_directory, "operately"), "new")
    archive = Path.join(directory, "release.tar.gz")
    {_, 0} = System.cmd("tar", ["-czf", archive, "-C", release_directory, "operately"])

    write_command(directory, "curl", "cp \"$UPDATE_ARCHIVE\" \"$3\"")
    write_command(directory, "docker", """
    printf '%s\\n' "$*" >> docker-calls
    if [ "$*" = "${FAIL_COMMAND:-}" ]; then exit 1; fi
    """)

    {:ok, directory: directory, archive: archive}
  end

  test "stops the old app before migrating and starts the new app afterward", ctx do
    assert {_, 0} = update(ctx)
    assert docker_calls(ctx) == ["compose version", "compose pull app", @stop, @migrate, "compose up -d"]
    assert File.read!(Path.join(ctx.directory, "docker-compose.yml")) =~ "operately/operately:new"
  end

  test "does not migrate or start the app if stopping fails", ctx do
    assert {_, 1} = update(ctx, @stop)
    assert docker_calls(ctx) == ["compose version", "compose pull app", @stop]
  end

  test "leaves the app stopped if migration fails", ctx do
    assert {_, 1} = update(ctx, @migrate)
    assert docker_calls(ctx) == ["compose version", "compose pull app", @stop, @migrate]
  end

  defp update(ctx, fail_command \\ "") do
    System.cmd("bash", ["operately", "update", "new"],
      cd: ctx.directory,
      env: [
        {"PATH", Path.join(ctx.directory, "bin") <> ":" <> System.fetch_env!("PATH")},
        {"UPDATE_ARCHIVE", ctx.archive},
        {"FAIL_COMMAND", fail_command}
      ],
      stderr_to_stdout: true
    )
  end

  defp write_release(directory, version) do
    for filename <- ["operately", "docker-compose.yml"] do
      contents = EEx.eval_file(Path.join(@templates, "#{filename}.eex"), version: version, templates_dir: @templates)
      File.write!(Path.join(directory, filename), contents)
    end
  end

  defp docker_calls(ctx), do: ctx.directory |> Path.join("docker-calls") |> File.read!() |> String.split("\n", trim: true)

  defp write_command(directory, name, body) do
    path = Path.join([directory, "bin", name])
    File.write!(path, "#!/usr/bin/env bash\nset -euo pipefail\n" <> body <> "\n")
    File.chmod!(path, 0o755)
  end
end
