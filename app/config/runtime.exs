import Config

# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere. Do not define
# any compile-time configuration in here, as it won't be applied.
# The block below contains prod specific runtime configuration.

# ## Using releases
#
# If you use `mix release`, you need to explicitly enable the server
# by passing the PHX_SERVER=true when you start it:
#
#     PHX_SERVER=true bin/operately start
#
# Alternatively, you can use `mix phx.gen.release` to generate a `bin/server`
# script that automatically sets the env var above.
if System.get_env("PHX_SERVER") do
  config :operately, OperatelyWeb.Endpoint, server: true
end

config :langchain, :anthropic_key, System.get_env("ANTHROPIC_API_KEY")
config :langchain, :openai_key, System.get_env("OPENAI_API_KEY")

config :operately, :demo_builder_allowed, System.get_env("OPERATELY_DEMO_BUILDER_ALLOWED") == "true"
config :operately, :blob_token_secret_key, System.get_env("OPERATELY_BLOB_TOKEN_SECRET_KEY")
config :operately, :js_sentry_enabled, System.get_env("OPERATELY_JS_SENTRY_ENABLED") == "true"
config :operately, :js_sentry_dsn, System.get_env("OPERATELY_JS_SENTRY_DSN")
config :operately, :storage_type, System.get_env("OPERATELY_STORAGE_TYPE", "local")

config :operately, :allow_login_with_email, System.get_env("ALLOW_LOGIN_WITH_EMAIL", "no") == "yes"
config :operately, :allow_signup_with_email, System.get_env("ALLOW_SIGNUP_WITH_EMAIL", "no") == "yes"
config :operately, :require_email_verification, System.get_env("REQUIRE_EMAIL_VERIFICATION", "no") == "yes"

config :operately, :allow_login_with_google, System.get_env("ALLOW_LOGIN_WITH_GOOGLE", "no") == "yes"
config :operately, :allow_signup_with_google, System.get_env("ALLOW_SIGNUP_WITH_GOOGLE", "no") == "yes"

config :operately, :send_onboarding_emails, System.get_env("SEND_ONBOARDING_EMAILS", "no") == "yes"
config :operately, :sendgrid_saas_onboarding_list_id, System.get_env("SENDGRID_SAAS_ONBOARDING_LIST_ID")

config :operately, :send_company_creation_notifications, System.get_env("SEND_COMPANY_CREATION_NOTIFICATIONS", "no") == "yes"
config :operately, :company_creation_notification_webhook_url, System.get_env("COMPANY_CREATION_NOTIFICATION_WEBHOOK_URL")

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :operately, Operately.Repo,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: maybe_ipv6

  # The secret key base is used to sign/encrypt cookies and other secrets.
  # A default value is used in config/dev.exs and config/test.exs but you
  # want to use a different value for prod and you most likely don't want
  # to check this value into version control, so we use an environment
  # variable instead.
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("OPERATELY_HOST")
  port = String.to_integer(System.get_env("PORT") || "4000")
  scheme = System.get_env("OPERATELY_URL_SCHEME") || "https"

  if host == nil do
    raise """
    environment variable OPERATELY_HOST is missing.
    """
  end

  config :operately, OperatelyWeb.Endpoint,
    url: [host: host, port: 443, scheme: scheme],
    http: [
      # Enable IPv6 and bind on all interfaces.
      # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
      # See the documentation on https://hexdocs.pm/plug_cowboy/Plug.Cowboy.html
      # for details about using IPv6 vs IPv4 and loopback vs public addresses.
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    https: [
      port: 4001
    ],
    secret_key_base: secret_key_base

  config :operately, notification_email: System.get_env("NOTIFICATION_EMAIL")

  # ## SSL Support
  #
  # To get SSL working, you will need to add the `https` key
  # to your endpoint configuration:
  #
  #     config :operately, OperatelyWeb.Endpoint,
  #       https: [
  #         ...,
  #         port: 443,
  #         cipher_suite: :strong,
  #         keyfile: System.get_env("SOME_APP_SSL_KEY_PATH"),
  #         certfile: System.get_env("SOME_APP_SSL_CERT_PATH")
  #       ]
  #
  # The `cipher_suite` is set to `:strong` to support only the
  # latest and more secure SSL ciphers. This means old browsers
  # and clients may not be supported. You can set it to
  # `:compatible` for wider support.
  #
  # `:keyfile` and `:certfile` expect an absolute path to the key
  # and cert in disk or a relative path inside priv, for example
  # "priv/ssl/server.key". For all supported SSL configuration
  # options, see https://hexdocs.pm/plug/Plug.SSL.html#configure/1
  #
  # We also recommend setting `force_ssl` in your endpoint, ensuring
  # no data is ever sent via http, always redirecting to https:
  #
  #     config :operately, OperatelyWeb.Endpoint,
  #       force_ssl: [hsts: true]
  #
  # Check `Plug.SSL` for all available options in `force_ssl`.

  # ## Configuring the mailer
  #
  # In production you need to configure the mailer to use a different adapter.
  # Also, you may need to configure the Swoosh API client of your choice if you
  # are not using SMTP. Here is an example of the configuration:
  #
  #     config :operately, Operately.Mailer,
  #       adapter: Swoosh.Adapters.Mailgun,
  #       api_key: System.get_env("MAILGUN_API_KEY"),
  #       domain: System.get_env("MAILGUN_DOMAIN")
  #
  # For this example you need include a HTTP client required by Swoosh API client.
  # Swoosh supports Hackney and Finch out of the box:
  #
  #     config :swoosh, :api_client, Swoosh.ApiClient.Hackney
  #
  # See https://hexdocs.pm/swoosh/Swoosh.html#module-installation for details.
end
