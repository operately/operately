defmodule Operately.Release do
  @moduledoc """
  Used for executing DB release tasks when run in production without Mix
  installed.
  """
  @app :operately

  def create_db do
    IO.write("Waiting for database to be ready ")
    :ok = wait_until_db_ready(attempts: 10, timeout: 1000)

    IO.puts("Creating database")
    case storage_up?() do
      :ok -> :ok
      {:error, :already_up} -> :ok
      {:error, term} -> raise term
    end
  end

  def migrate do
    IO.puts("Running migrations")
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo(), &Ecto.Migrator.run(&1, :up, all: true))
  end

  def rollback(version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo(), &Ecto.Migrator.run(&1, :down, to: version))
  end

  def generate_script do
    version = Operately.version()
    script_content = generate_operately_script(version)
    IO.puts(script_content)
  end

  #
  # Private
  #

  defp repo do
    Application.fetch_env!(@app, :ecto_repos) |> hd()
  end

  defp load_app do
    Application.load(@app)
  end

  defp storage_up? do
    repo().__adapter__().storage_up(repo().config())
  end

  defp storage_host do
    Keyword.get(repo().config(), :hostname) |> String.to_charlist()
  end

  defp storage_port do
    Keyword.get(repo().config(), :port) || 5432
  end

  def wait_until_db_ready(attempts: attempts, timeout: timeout) do
    if attempts > 0 do
      case :gen_tcp.connect(storage_host(), storage_port(), []) do
        {:ok, _} ->
          IO.puts("")
          :ok
        {:error, _error} ->
          IO.write(".")
          :timer.sleep(timeout)
          wait_until_db_ready(attempts: attempts - 1, timeout: timeout)
      end
    else
      :timeout
    end
  end

  defp generate_operately_script(version) do
    template_path = Path.join([
      :code.priv_dir(:operately),
      "rel",
      "single-host",
      "templates",
      "operately.eex"
    ])
    templates_dir = Path.dirname(template_path)

    EEx.eval_file(template_path, version: version, templates_dir: templates_dir)
  end
end
