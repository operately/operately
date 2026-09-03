defmodule Operately.Sentry do
  @moduledoc """
  Backend Sentry setup.

  Uses the same `OPERATELY_JS_SENTRY_ENABLED` / `OPERATELY_JS_SENTRY_DSN`
  variables as the browser SDK so a production deploy that already reports
  frontend errors also reports backend errors.
  """

  @handler_id :sentry_handler

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

  defp valid_dsn?(dsn) when is_binary(dsn), do: String.trim(dsn) != ""

  defp valid_dsn?(_), do: false
end
