defmodule OperatelyWeb.CertificationTest do
  use ExUnit.Case, async: false

  alias OperatelyWeb.Certification

  setup do
    original_app_env = Application.get_env(:operately, :app_env)
    original_port_offset = System.get_env("PORT_OFFSET")

    on_exit(fn ->
      restore_application_env(:operately, :app_env, original_app_env)
      restore_system_env("PORT_OFFSET", original_port_offset)
    end)
  end

  describe "directory_url/0" do
    test "returns ACME directory URL for production" do
      Application.put_env(:operately, :app_env, :prod)
      assert Certification.directory_url() == "https://acme-v02.api.letsencrypt.org/directory"
    end

    test "returns internal ACME server with dynamic port for dev" do
      Application.put_env(:operately, :app_env, :dev)

      # Default port offset (4000)
      System.delete_env("PORT_OFFSET")
      assert {:internal, port: 4009} = Certification.directory_url()

      # Custom port offset
      System.put_env("PORT_OFFSET", "5000")
      assert {:internal, port: 5009} = Certification.directory_url()
    end

    test "returns internal ACME server with dynamic port for test" do
      Application.put_env(:operately, :app_env, :test)

      # Default port offset (4000)
      System.delete_env("PORT_OFFSET")
      assert {:internal, port: 4010} = Certification.directory_url()

      # Custom port offset
      System.put_env("PORT_OFFSET", "5000")
      assert {:internal, port: 5010} = Certification.directory_url()
    end

    test "dev and test ports do not conflict with other services" do
      # Storybook uses PORT_OFFSET + 3 (default: 4003)
      # Screenshots uses PORT_OFFSET + 4 (default: 4004)
      # Dev ACME should be PORT_OFFSET + 9 (default: 4009)
      # Test ACME should be PORT_OFFSET + 10 (default: 4010)

      Application.put_env(:operately, :app_env, :dev)
      System.delete_env("PORT_OFFSET")
      {:internal, port: dev_port} = Certification.directory_url()

      Application.put_env(:operately, :app_env, :test)
      {:internal, port: test_port} = Certification.directory_url()

      # Ensure no conflicts with known service ports
      refute dev_port == 4003, "ACME dev port conflicts with Storybook"
      refute dev_port == 4004, "ACME dev port conflicts with Screenshots"
      refute test_port == 4003, "ACME test port conflicts with Storybook"
      refute test_port == 4004, "ACME test port conflicts with Screenshots"
    end
  end

  defp restore_application_env(app, key, nil), do: Application.delete_env(app, key)
  defp restore_application_env(app, key, value), do: Application.put_env(app, key, value)

  defp restore_system_env(key, nil), do: System.delete_env(key)
  defp restore_system_env(key, value), do: System.put_env(key, value)
end
