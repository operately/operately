defmodule Operately.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      OperatelyWeb.Telemetry,
      Operately.Repo,
      Operately.Mcp.RateLimit,
      Operately.ProductReleases.Cache,
      OperatelyWeb.Endpoint,
      {Oban, Application.fetch_env!(:operately, Oban)},
      {Finch, name: Operately.Finch},
      {Phoenix.PubSub,
       [
         name: Operately.PubSub,
         adapter: Operately.PubSub.PostgresPubSub
       ]}
    ]

    :ok = Oban.Telemetry.attach_default_logger()

    if Operately.Sentry.enabled?() do
      :ok = Operately.Sentry.setup_logger_handler()
      :ok = Operately.Sentry.attach_oban_handler()
    end

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Operately.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    OperatelyWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
