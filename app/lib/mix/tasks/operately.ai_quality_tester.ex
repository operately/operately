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
    disable_sql_logs()
    setup_database()

    # Create test account and provide login info
    {email, password} = create_test_account()

    Mix.shell().info("AI Quality Tester setup completed successfully.")
    Mix.shell().info("")
    Mix.shell().info("🌐 Login URL: #{OperatelyWeb.Endpoint.url()}/log_in")
    Mix.shell().info("📧 Email: #{email}")
    Mix.shell().info("🔑 Password: #{password}")
    Mix.shell().info("")
    Mix.shell().info("Press Enter to continue after you've finished testing in the browser...")

    # Wait for user input
    IO.gets("")

    Mix.shell().info("AI Quality Tester task completed.")
  end

  defp ensure_test_env do
    unless Mix.env() == :test do
      Mix.shell().error("This task can only be run in the test environment.")
      Mix.shell().error("Please run: MIX_ENV=test mix operately.ai_quality_tester")

      System.halt(1)
    end
  end

  defp disable_sql_logs do
    # Disable SQL query logging for cleaner output
    Logger.configure(level: :warning)

    # Also disable Ecto query logging specifically
    Logger.put_module_level(Ecto.Adapters.SQL, :warning)
  end

  defp setup_application do
    Mix.shell().info("Starting application...")

    # Check if the application is already running
    case Application.ensure_all_started(:operately) do
      {:ok, _} ->
        Mix.shell().info("Application started successfully.")

      {:error, {:operately, {{:shutdown, {:failed_to_start_child, _, :start_error}}, _}}} ->
        # Handle case where endpoint is already running (port in use)
        if Process.whereis(OperatelyWeb.Endpoint) do
          Mix.shell().info("Application already running, reusing existing instance.")
        else
          Mix.shell().error("Failed to start application - port may be in use")
          Mix.shell().info("Try killing existing processes: pkill -f 'beam.*operately'")
          System.halt(1)
        end

      {:error, error} ->
        Mix.shell().error("Failed to start application: #{inspect(error)}")
        System.halt(1)
    end

    # Verify the endpoint is running
    unless Process.whereis(OperatelyWeb.Endpoint) do
      Mix.shell().error("Failed to start web server endpoint")
      System.halt(1)
    end
  end

  defp setup_database do
    Mix.shell().info("Setting up database connection...")

    # Set up Ecto sandbox in shared mode for mix tasks
    _ = Ecto.Adapters.SQL.Sandbox.mode(Operately.Repo, {:shared, self()})

    # Check out a connection for this process
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Operately.Repo)

    # Test database connectivity
    case Ecto.Adapters.SQL.query(Operately.Repo, "SELECT 1", []) do
      {:ok, _} ->
        Mix.shell().info("Database connection verified.")

      {:error, error} ->
        Mix.shell().error("Database connection failed: #{inspect(error)}")
        System.halt(1)
    end
  end

  defp create_test_account do
    Mix.shell().info("Creating test account...")

    # Create test account
    email = "test@operately.local"
    # Must be at least 12 characters
    password = "password123456"

    {:ok, account} =
      Operately.People.register_account(%{
        email: email,
        password: password,
        full_name: "Test User"
      })

    # Create test company
    {:ok, _company} =
      Operately.Companies.create_company(
        %{
          mission: "AI Quality Testing Company",
          company_name: "Test Company",
          trusted_email_domains: [],
          title: "Quality Tester"
        },
        account
      )

    Mix.shell().info("Test account created successfully.")

    {email, password}
  end
end
