defmodule Operately.Sentry do
  @moduledoc """
  Backend Sentry setup.

  Uses the same `OPERATELY_JS_SENTRY_ENABLED` / `OPERATELY_JS_SENTRY_DSN`
  variables as the browser SDK so a production deploy that already reports
  frontend errors also reports backend errors.
  """

  require Logger

  @handler_id :sentry_handler
  @oban_telemetry_id "sentry-oban-errors"

  @doc """
  DSN used by the Elixir SDK, or `nil` when frontend Sentry is off or unset.
  """
  def configured_dsn do
    dsn = System.get_env("OPERATELY_JS_SENTRY_DSN")

    if System.get_env("OPERATELY_JS_SENTRY_ENABLED") == "true" and valid_dsn?(dsn) do
      dsn
    else
      nil
    end
  end

  def enabled?, do: is_binary(configured_dsn())

  @doc """
  Registers `Sentry.LoggerHandler` so `:error`-level log events and crashes
  are reported to Sentry. Safe to call more than once.
  """
  def setup_logger_handler do
    case :logger.add_handler(@handler_id, Sentry.LoggerHandler, %{
           config: %{
             metadata: [:request_id],
             level: :error,
             capture_log_messages: true
           }
         }) do
      :ok -> :ok
      {:error, {:already_exist, _}} -> :ok
      {:error, :already_exists} -> :ok
    end
  end

  def logger_handler_id, do: @handler_id

  def attach_oban_handler do
    :telemetry.attach_many(
      @oban_telemetry_id,
      [[:oban, :job, :exception]],
      &__MODULE__.handle_oban_exception/4,
      %{}
    )
  end

  def handle_oban_exception([:oban, :job, :exception], measurements, %{job: job} = metadata, _config) do
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

    Sentry.capture_exception(
      oban_exception(metadata),
      stacktrace: Map.get(metadata, :stacktrace, []),
      tags: %{
        worker: job.worker,
        queue: job.queue,
        oban_job: true
      },
      extra: extra
    )
  rescue
    error ->
      Logger.warning("Failed to report Oban exception to Sentry: #{Exception.message(error)}")
      {:error, error}
  end

  defp oban_exception(metadata) do
    error = Map.get(metadata, :error) || Map.get(metadata, :reason)

    if is_exception(error) do
      error
    else
      RuntimeError.exception("Unknown Oban job error")
    end
  end

  defp valid_dsn?(dsn) when is_binary(dsn), do: String.trim(dsn) != ""

  defp valid_dsn?(_), do: false
end
