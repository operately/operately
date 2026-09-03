defmodule Operately.SentryTest do
  use ExUnit.Case, async: false

  @handler_id Operately.Sentry.logger_handler_id()
  @enabled_env "OPERATELY_JS_SENTRY_ENABLED"
  @dsn_env "OPERATELY_JS_SENTRY_DSN"
  @example_dsn "https://public@o0.ingest.sentry.io/1"

  setup do
    remove_handler()

    on_exit(fn ->
      remove_handler()
    end)

    :ok
  end

  describe "configured_dsn/0" do
    setup :restore_sentry_env

    test "returns the frontend DSN when JS Sentry is enabled" do
      System.put_env(@enabled_env, "true")
      System.put_env(@dsn_env, @example_dsn)

      assert Operately.Sentry.configured_dsn() == @example_dsn
      assert Operately.Sentry.enabled?()
    end

    test "returns nil when JS Sentry is disabled" do
      System.put_env(@enabled_env, "false")
      System.put_env(@dsn_env, @example_dsn)

      assert Operately.Sentry.configured_dsn() == nil
      refute Operately.Sentry.enabled?()
    end

    test "returns nil when the enabled flag is missing" do
      System.delete_env(@enabled_env)
      System.put_env(@dsn_env, @example_dsn)

      assert Operately.Sentry.configured_dsn() == nil
      refute Operately.Sentry.enabled?()
    end

    test "returns nil when the DSN is missing" do
      System.put_env(@enabled_env, "true")
      System.delete_env(@dsn_env)

      assert Operately.Sentry.configured_dsn() == nil
      refute Operately.Sentry.enabled?()
    end

    test "returns nil when the DSN is blank" do
      System.put_env(@enabled_env, "true")
      System.put_env(@dsn_env, "  ")

      assert Operately.Sentry.configured_dsn() == nil
      refute Operately.Sentry.enabled?()
    end
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
      source = read_app_file("lib/operately_web/endpoint.ex")

      assert source =~ "use Sentry.PlugCapture"
      assert source =~ "plug Sentry.PlugContext"
    end

    test "runtime config uses the frontend Sentry DSN" do
      source = read_app_file("config/runtime.exs")

      assert source =~ "Operately.Sentry.configured_dsn()"
      refute source =~ ~s[System.get_env("SENTRY_DSN")]
    end

    test "application starts Sentry from the frontend config" do
      source = read_app_file("lib/operately/application.ex")

      assert source =~ "Operately.Sentry.enabled?"
      refute source =~ ~s[System.get_env("SENTRY_DSN")]
    end
  end

  defp restore_sentry_env(_ctx) do
    original_enabled = System.get_env(@enabled_env)
    original_dsn = System.get_env(@dsn_env)

    on_exit(fn ->
      restore_env(@enabled_env, original_enabled)
      restore_env(@dsn_env, original_dsn)
    end)

    :ok
  end

  defp restore_env(key, nil), do: System.delete_env(key)
  defp restore_env(key, value), do: System.put_env(key, value)

  defp read_app_file(relative_path) do
    __DIR__
    |> Path.join("../../#{relative_path}")
    |> Path.expand()
    |> File.read!()
  end

  defp remove_handler do
    _ = :logger.remove_handler(@handler_id)
    :ok
  end
end
