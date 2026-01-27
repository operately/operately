defmodule OperatelyEmail.Mailers.Config.Env do
  @moduledoc false

  alias OperatelyEmail.Mailers.Config.TLS

  @tls_required_smtp_providers ["aws-ses", "mailjet"]

  def configured? do
    System.get_env("SENDGRID_API_KEY", "") != "" or System.get_env("SMTP_SERVER", "") != ""
  end

  def dev_config do
    [adapter: Swoosh.Adapters.Local]
  end

  def test_config do
    if System.get_env("E2E_EMAIL_TEST") do
      smtp_config()
    else
      [adapter: Swoosh.Adapters.Test]
    end
  end

  def prod_config do
    smtp_provider = System.get_env("SMTP_PROVIDER", "")

    cond do
      System.get_env("SENDGRID_API_KEY", "") != "" -> sendgrid_config()
      smtp_provider in @tls_required_smtp_providers -> smtp_config_tls()
      System.get_env("SMTP_SERVER", "") != "" -> smtp_config()
      true -> raise "No valid email configuration found"
    end
  end

  defp smtp_config do
    [
      adapter: Swoosh.Adapters.SMTP,
      relay: System.get_env("SMTP_SERVER"),
      port: String.to_integer(System.get_env("SMTP_PORT", "587")),
      username: System.get_env("SMTP_USERNAME"),
      password: System.get_env("SMTP_PASSWORD"),
      ssl: System.get_env("SMTP_SSL", "false") == "true",
      tls: :if_available,
      auth: :always,
      retries: 2
    ]
  end

  defp smtp_config_tls do
    [
      adapter: Swoosh.Adapters.SMTP,
      relay: System.get_env("SMTP_SERVER"),
      port: String.to_integer(System.get_env("SMTP_PORT", "587")),
      username: System.get_env("SMTP_USERNAME"),
      password: System.get_env("SMTP_PASSWORD"),
      ssl: System.get_env("SMTP_SSL", "false") == "true",
      tls: :always,
      tls_options: TLS.options(),
      auth: :always,
      retries: 2
    ]
  end

  defp sendgrid_config do
    [
      adapter: Swoosh.Adapters.Sendgrid,
      api_key: System.get_env("SENDGRID_API_KEY")
    ]
  end
end
