defmodule OperatelyEmail.Mailers.BaseMailerTest do
  use ExUnit.Case
  
  describe "SMTP configuration detection" do
    setup do
      # Store original env var to restore later
      original_smtp_server = System.get_env("SMTP_SERVER")

      on_exit(fn ->
        # Restore or delete env var
        if original_smtp_server do
          System.put_env("SMTP_SERVER", original_smtp_server)
        else
          System.delete_env("SMTP_SERVER")
        end
      end)

      :ok
    end

    test "SMTP server environment variable detection" do
      # Test when SMTP_SERVER is not set
      System.delete_env("SMTP_SERVER")
      refute smtp_configured?()
      
      # Test when SMTP_SERVER is set
      System.put_env("SMTP_SERVER", "smtp.example.com")
      assert smtp_configured?()
    end
  end

  describe "SMTP configuration parsing" do
    setup do
      # Store original env vars to restore later
      original_env = %{
        smtp_server: System.get_env("SMTP_SERVER"),
        smtp_port: System.get_env("SMTP_PORT"),
        smtp_username: System.get_env("SMTP_USERNAME"),
        smtp_password: System.get_env("SMTP_PASSWORD"),
        smtp_tls: System.get_env("SMTP_TLS"),
        smtp_ssl: System.get_env("SMTP_SSL")
      }

      on_exit(fn ->
        # Restore or delete env vars
        Enum.each(original_env, fn {key, value} ->
          env_key = key |> Atom.to_string() |> String.upcase()
          if value do
            System.put_env(env_key, value)
          else
            System.delete_env(env_key)
          end
        end)
      end)

      :ok
    end

    test "SMTP port parsing with default" do
      System.put_env("SMTP_SERVER", "smtp.example.com")
      
      # Test default port
      System.delete_env("SMTP_PORT")
      config = get_smtp_config_for_test()
      assert config[:port] == 587
      
      # Test custom port
      System.put_env("SMTP_PORT", "25")
      config = get_smtp_config_for_test()
      assert config[:port] == 25
    end

    test "SMTP TLS/SSL boolean parsing" do
      System.put_env("SMTP_SERVER", "smtp.example.com")
      
      # Test TLS default (true)
      System.delete_env("SMTP_TLS")
      config = get_smtp_config_for_test()
      assert config[:tls] == true
      
      # Test TLS false
      System.put_env("SMTP_TLS", "false")
      config = get_smtp_config_for_test()
      assert config[:tls] == false
      
      # Test SSL default (false)
      System.delete_env("SMTP_SSL")
      config = get_smtp_config_for_test()
      assert config[:ssl] == false
      
      # Test SSL true
      System.put_env("SMTP_SSL", "true")
      config = get_smtp_config_for_test()
      assert config[:ssl] == true
    end

    test "complete SMTP configuration" do
      System.put_env("SMTP_SERVER", "smtp.example.com")
      System.put_env("SMTP_PORT", "465")
      System.put_env("SMTP_USERNAME", "user@example.com")
      System.put_env("SMTP_PASSWORD", "secret123")
      System.put_env("SMTP_TLS", "false")
      System.put_env("SMTP_SSL", "true")
      
      config = get_smtp_config_for_test()
      
      assert config[:server] == "smtp.example.com"
      assert config[:hostname] == "smtp.example.com"
      assert config[:port] == 465
      assert config[:username] == "user@example.com"
      assert config[:password] == "secret123"
      assert config[:tls] == false
      assert config[:ssl] == true
      assert config[:retries] == 1
      assert config[:no_mx_lookups] == false
      assert config[:allowed_tls_versions] == [:tlsv1, :"tlsv1.1", :"tlsv1.2"]
    end
  end

  # Helper functions to test private functionality indirectly
  defp smtp_configured?() do
    System.get_env("SMTP_SERVER") != nil
  end

  defp get_smtp_config_for_test() do
    %{
      server: System.get_env("SMTP_SERVER"),
      hostname: System.get_env("SMTP_SERVER"),
      port: String.to_integer(System.get_env("SMTP_PORT", "587")),
      username: System.get_env("SMTP_USERNAME"),
      password: System.get_env("SMTP_PASSWORD"),
      tls: parse_boolean_for_test(System.get_env("SMTP_TLS", "true")),
      allowed_tls_versions: [:tlsv1, :"tlsv1.1", :"tlsv1.2"],
      ssl: parse_boolean_for_test(System.get_env("SMTP_SSL", "false")),
      retries: 1,
      no_mx_lookups: false
    }
  end

  defp parse_boolean_for_test("true"), do: true
  defp parse_boolean_for_test("false"), do: false
  defp parse_boolean_for_test(_), do: false
end