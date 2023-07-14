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
      {Phoenix.PubSub, name: Operately.PubSub},
      {Finch, name: Operately.Finch},
      OperatelyWeb.Endpoint,
      {Absinthe.Subscription, OperatelyWeb.Endpoint},
      {Oban, Application.fetch_env!(:operately, Oban)}
    ]

    children = configure_query_counter(children)

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

  def configure_query_counter(children) do
    if Application.get_env(:operately, :start_query_counter) do
      handler = &Operately.QueryCounter.handle_event/4
      :ok = :telemetry.attach("operately-ecto", [:operately, :repo, :query], handler, %{})

      children ++ [{Operately.QueryCounter, []}]
    else
      children
    end
  end
end
