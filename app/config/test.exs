import Config

config :operately, :app_env, :test

# Only in tests, remove the complexity from the password hashing algorithm
config :bcrypt_elixir, :log_rounds, 1

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :operately, Operately.Repo,
  username: System.get_env("DB_USERNAME"),
  password: System.get_env("DB_PASSWORD"),
  hostname: System.get_env("DB_HOST"),
  database: "operately_test",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool: Ecto.Adapters.SQL.Sandbox,

  pool_size: if(System.get_env("CI"), do: 30, else: 10),
  queue_target: if(System.get_env("CI"), do: 10_000, else: 5_000),
  queue_interval: if(System.get_env("CI"), do: 2_000, else: 1_000),
  timeout: if(System.get_env("CI"), do: 30_000, else: 15_000),
  ownership_timeout: if(System.get_env("CI"), do: 30_000, else: 10_000)

config :operately, OperatelyWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 4002],
  https: false,
  secret_key_base: "NFTmJV4MLY6l2RZWQQYr5XdVpKZ2hIpKsTdJOuUiyc/iHf4rXH1iCdHcNKtWjdV3",
  server: true

# Enable test routes, login helpers, etc.
config :operately, :test_routes, true

# In test we don't send emails.
config :operately, Operately.Mailer, adapter: Swoosh.Adapters.Test

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

config :operately, :start_query_counter, true
config :operately, :restrict_entry, false

config :operately, Oban, testing: :inline

config :junit_formatter,
  report_dir: "testreports",
  # Save output to "/tmp/junit.xml"
  report_file: "junit.xml",
  # Adds information about file location when suite finishes
  print_report_file: false,
  # Include filename and file number for more insights
  include_filename?: true,
  include_file_line?: true

config :operately, notification_email: "test@localhost"
config :operately, :sandbox, Ecto.Adapters.SQL.Sandbox

config :wallaby, screenshot_on_failure: true
config :wallaby, otp_app: :operately
config :wallaby, hackney_options: [timeout: 3_000]
