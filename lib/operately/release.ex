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
    case repo().__adapter__.storage_up(repo().config) do
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

  #
  # Private
  #

  defp repo do
    Application.fetch_env!(@app, :ecto_repos) |> hd()
  end

  defp load_app do
    Application.load(@app)
  end

  def wait_until_db_ready(attempts: attempts, timeout: timeout) do
    host = Keyword.get(repo().config, :hostname) |> String.to_charlist()
    port = Keyword.get(repo().config, :port) || 5432

    if attempts > 0 do
      case :gen_tcp.connect(host, port, []) do
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
end
