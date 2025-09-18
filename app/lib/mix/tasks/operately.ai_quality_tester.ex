defmodule Mix.Tasks.Operately.AiQualityTester do
  @moduledoc """
  AI Quality Tester task for Operately.

  This task provides automated quality testing capabilities using AI.

  **Note: This task can only be run in the test environment.**

  ## Usage

      MIX_ENV=test mix operately.ai_quality_tester [options]

  ## Options

    * `--help` - Show this help message

  ## Examples

      MIX_ENV=test mix operately.ai_quality_tester
      MIX_ENV=test mix operately.ai_quality_tester --help

  """

  use Mix.Task

  @impl Mix.Task
  def run(_args) do
    ensure_test_env()
    setup_application()
    setup_database()

    Mix.shell().info("AI Quality Tester setup completed successfully.")
    Mix.shell().info("Web server running at: #{OperatelyWeb.Endpoint.url()}")

    # TODO: Implement AI quality testing logic here

    Mix.shell().info("AI Quality Tester task completed.")
  end

  defp ensure_test_env do
    unless Mix.env() == :test do
      Mix.shell().error("This task can only be run in the test environment.")
      Mix.shell().error("Please run: MIX_ENV=test mix operately.ai_quality_tester")

      System.halt(1)
    end
  end

  defp setup_application do
    Mix.shell().info("Starting application...")

    # Ensure the application is started with all dependencies
    {:ok, _} = Application.ensure_all_started(:operately)

    # Verify the endpoint is running
    unless Process.whereis(OperatelyWeb.Endpoint) do
      Mix.shell().error("Failed to start web server endpoint")
      System.halt(1)
    end
  end

  defp setup_database do
    Mix.shell().info("Setting up database connection...")

    # Ensure Ecto is started and database is accessible
    _ = Ecto.Adapters.SQL.Sandbox.mode(Operately.Repo, :manual)

    # Test database connectivity
    case Ecto.Adapters.SQL.query(Operately.Repo, "SELECT 1", []) do
      {:ok, _} ->
        Mix.shell().info("Database connection verified.")

      {:error, error} ->
        Mix.shell().error("Database connection failed: #{inspect(error)}")
        System.halt(1)
    end
  end
end
