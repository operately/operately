defmodule OperatelyEmail.Mailers.BaseMailer do
  def deliver_now(email) do
    Operately.Mailer.deliver(email, config())
  end

  defp config do
    case Application.get_env(:operately, :app_env) do
      :dev -> dev_config()
      :test -> test_config()
      :prod -> prod_config()
    end
  end

  defp dev_config do
    [adapter: Swoosh.Adapters.Local]
  end

  defp test_config do
    [adapter: Swoosh.Adapters.Test]
  end

  defp prod_config do
    cond do
      System.get_env("SENDGRID_API_KEY", "") != "" -> prod_sendgrid_config()
      System.get_env("SMTP_SERVER", "") != "" -> prod_smtp_config()
      true -> raise "No valid email configuration found"
    end
  end

  defp prod_smtp_config() do
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

  defp prod_sendgrid_config() do
    [
      adapter: Swoosh.Adapters.Sendgrid,
      api_key: System.get_env("SENDGRID_API_KEY")
    ]
  end
end
