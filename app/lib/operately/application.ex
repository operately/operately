defmodule Operately.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application
  require Logger

  @impl true
  def start(_type, _args) do
    # Initialize Sentry if DSN is configured
    if System.get_env("SENTRY_DSN") do
      Logger.metadata(sentry: :enabled)
    end

    children = [
      OperatelyWeb.Telemetry,
      Operately.Repo,
      OperatelyWeb.Endpoint,
      Operately.Ai.Prompts,
      {Oban, Application.fetch_env!(:operately, Oban)},
      {Finch, name: Operately.Finch},
      {Phoenix.PubSub,
       [
         name: Operately.PubSub,
         adapter: Operately.PubSub.PostgresPubSub
       ]}
    ]

    :ok = Oban.Telemetry.attach_default_logger()
    
    # Attach Sentry telemetry for Oban job failures
    if System.get_env("SENTRY_DSN") do
      attach_sentry_telemetry()
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

  # Attach Sentry telemetry for Oban job failures
  defp attach_sentry_telemetry do
    events = [
      [:oban, :job, :exception]
    ]

    :telemetry.attach_many(
      "sentry-oban-errors",
      events,
      &handle_oban_exception/4,
      %{}
    )
  end

  defp handle_oban_exception(
         [:oban, :job, :exception],
         measurements,
         %{job: job} = metadata,
         _config
       ) do
    extra = %{
      job_id: job.id,
      queue: job.queue,
      worker: job.worker,
      args: job.args,
      attempt: job.attempt,
      max_attempts: job.max_attempts,
      duration: Map.get(measurements, :duration),
      queue_time: Map.get(measurements, :queue_time)
    }

    context = %{
      tags: %{
        worker: job.worker,
        queue: job.queue,
        oban_job: true
      },
      extra: extra
    }

    Sentry.capture_exception(
      Map.get(metadata, :error, RuntimeError.exception("Unknown Oban job error")),
      stacktrace: Map.get(metadata, :stacktrace, []),
      contexts: context
    )
  end
end
