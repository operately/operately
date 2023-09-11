# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.14.41",
  default: [
    args:
      ~w(js/app.tsx --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :operately,
  ecto_repos: [Operately.Repo],
  generators: [binary_id: true]

# Configures the endpoint
config :operately, OperatelyWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    formats: [html: OperatelyWeb.ErrorHTML, json: OperatelyWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Operately.PubSub,
  live_view: [signing_salt: "id39WNH9"]

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :operately, Operately.Mailer, adapter: Swoosh.Adapters.Local

# Configure tailwind (the version is required)
config :tailwind,
  version: "3.2.4",
  default: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :ueberauth, Ueberauth,
  base_path: "/accounts/auth",
  providers: [
    google: {Ueberauth.Strategy.Google, [
      default_scope: "email profile"
    ]}
  ]

config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: {System, :get_env, ["GOOGLE_LOGIN_CLIENT_ID"]},
  client_secret: {System, :get_env, ["GOOGLE_LOGIN_CLIENT_SECRET"]}

config :operately, :restrict_entry, true

config :operately, Oban,
  repo: Operately.Repo,
  plugins: [
    {Oban.Plugins.Pruner, max_age: 300},    
    {Oban.Plugins.Cron,
     crontab: [
       {"0 8 * * *", OperatelyEmail.Assignments.Cron}
     ]}
  ],
  queues: [
    default: 10, 
    mailer: 10
  ]

config :operately, OperatelyEmail.Mailer,
  adapter: Bamboo.LocalAdapter

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
