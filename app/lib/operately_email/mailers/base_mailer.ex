defmodule OperatelyEmail.Mailers.BaseMailer do
  def deliver_now(email) do
    Operately.Mailer.deliver(email, config())
  end

  def email_delivery_configured? do
    case Application.get_env(:operately, :app_env) do
      :prod -> prod_email_configured?()
      _ -> true
    end
  end

  defp config do
    case Application.get_env(:operately, :app_env) do
      :dev -> dev_config()
      :test -> test_config()
      :prod -> prod_config()
    end
  end

  defp prod_email_configured? do
    System.get_env("SENDGRID_API_KEY", "") != "" or System.get_env("SMTP_SERVER", "") != ""
  end

  defp dev_config do
    [adapter: Swoosh.Adapters.Local]
  end

  defp test_config do
    if System.get_env("E2E_EMAIL_TEST") do
      smtp_config()
    else
      [adapter: Swoosh.Adapters.Test]
    end
  end

  defp prod_config do
    cond do
      System.get_env("SENDGRID_API_KEY", "") != "" -> prod_sendgrid_config()
      System.get_env("SMTP_PROVIDER", "") == "aws-ses" -> smtp_config_tls()
      System.get_env("SMTP_PROVIDER", "") == "mailjet" -> smtp_config_tls()
      System.get_env("SMTP_SERVER", "") != "" -> smtp_config()
      true -> raise "No valid email configuration found"
    end
  end

  defp smtp_config() do
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

  defp smtp_config_tls() do
    [
      adapter: Swoosh.Adapters.SMTP,
      relay: System.get_env("SMTP_SERVER"),
      port: String.to_integer(System.get_env("SMTP_PORT", "587")),
      username: System.get_env("SMTP_USERNAME"),
      password: System.get_env("SMTP_PASSWORD"),
      ssl: System.get_env("SMTP_SSL", "false") == "true",
      tls: :always,
      tls_options: tls_options(),
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

  defp tls_options do
    smtp_server = System.get_env("SMTP_SERVER")

    base_options = [
      verify: :verify_peer,
      depth: 3,
      versions: [:"tlsv1.2"],
      server_name_indication: String.to_charlist(smtp_server),
      customize_hostname_check: [
        match_fun: :public_key.pkix_verify_hostname_match_fun(:https)
      ]
    ]

    case System.get_env("SMTP_CACERTFILE") || default_cacertfile() do
      nil ->
        base_options ++ [cacerts: :public_key.cacerts_get()]

      cacertfile ->
        base_options ++ [cacertfile: cacertfile]
    end
  end

  defp default_cacertfile do
    [
      "/etc/ssl/certs/ca-certificates.crt",
      "/etc/ssl/cert.pem"
    ]
    |> Enum.find(fn path -> File.exists?(path) end)
  end
end
