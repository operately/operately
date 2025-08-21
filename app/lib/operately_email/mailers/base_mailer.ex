defmodule OperatelyEmail.Mailers.BaseMailer do
  def deliver_now(email) do
    Bamboo.Mailer.deliver_now(adapter(), email, config(), [])
  end

  # Public function for testing adapter selection
  def adapter() do
    cond do
      Application.get_env(:operately, :dev_routes)  -> Bamboo.LocalAdapter
      Application.get_env(:operately, :test_routes) -> Bamboo.TestAdapter
      smtp_configured?() -> Bamboo.SMTPAdapter
      true -> Bamboo.SendGridAdapter
    end
  end

  defp config() do
    cond do
      Application.get_env(:operately, :dev_routes) -> %{}
      Application.get_env(:operately, :test_routes) -> %{}
      smtp_configured?() -> smtp_config()
      true -> sendgrid_config()
    end
  end

  defp smtp_configured?() do
    System.get_env("SMTP_SERVER") != nil
  end

  defp smtp_config() do
    %{
      server: System.get_env("SMTP_SERVER"),
      hostname: System.get_env("SMTP_SERVER"),
      port: String.to_integer(System.get_env("SMTP_PORT", "587")),
      username: System.get_env("SMTP_USERNAME"),
      password: System.get_env("SMTP_PASSWORD"),
      tls: parse_boolean(System.get_env("SMTP_TLS", "true")),
      allowed_tls_versions: [:tlsv1, :"tlsv1.1", :"tlsv1.2"],
      ssl: parse_boolean(System.get_env("SMTP_SSL", "false")),
      retries: 1,
      no_mx_lookups: false
    }
  end

  defp sendgrid_config() do
    %{
      api_key: System.get_env("SENDGRID_API_KEY"),
    }
  end

  defp parse_boolean("true"), do: true
  defp parse_boolean("false"), do: false
  defp parse_boolean(_), do: false
end
