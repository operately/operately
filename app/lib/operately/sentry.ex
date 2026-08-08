defmodule Operately.Sentry do
  @handler_id :sentry_handler

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
end
