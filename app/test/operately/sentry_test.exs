defmodule Operately.SentryTest do
  use ExUnit.Case, async: false

  @handler_id Operately.Sentry.logger_handler_id()

  setup do
    remove_handler()

    on_exit(fn ->
      remove_handler()
    end)

    :ok
  end

  describe "setup_logger_handler/0" do
    test "registers the Sentry logger handler" do
      assert :ok = Operately.Sentry.setup_logger_handler()

      assert {:ok, %{module: Sentry.LoggerHandler}} = :logger.get_handler_config(@handler_id)
    end

    test "is idempotent when the handler already exists" do
      assert :ok = Operately.Sentry.setup_logger_handler()
      assert :ok = Operately.Sentry.setup_logger_handler()

      assert {:ok, %{module: Sentry.LoggerHandler}} = :logger.get_handler_config(@handler_id)
    end
  end

  describe "endpoint integration" do
    test "Endpoint uses Sentry.PlugCapture and Sentry.PlugContext" do
      source =
        __DIR__
        |> Path.join("../../lib/operately_web/endpoint.ex")
        |> Path.expand()
        |> File.read!()

      assert source =~ "use Sentry.PlugCapture"
      assert source =~ "plug Sentry.PlugContext"
    end
  end

  defp remove_handler do
    _ = :logger.remove_handler(@handler_id)
    :ok
  end
end
