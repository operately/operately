defmodule Operately.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Start the Telemetry supervisor
      OperatelyWeb.Telemetry,
      # Start the Ecto repository
      Operately.Repo,
      # Start the PubSub system
      {Phoenix.PubSub, name: Operately.PubSub},
      # Start Finch
      {Finch, name: Operately.Finch},
      # Start the Endpoint (http/https)
      OperatelyWeb.Endpoint
      # Start a worker by calling: Operately.Worker.start_link(arg)
      # {Operately.Worker, arg}
    ]

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
