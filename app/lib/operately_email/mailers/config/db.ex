defmodule OperatelyEmail.Mailers.Config.Db do
  @moduledoc false

  alias Operately.SystemSettings.Cache
  alias Operately.SystemSettings.EmailConfig
  alias Operately.SystemSettings.EmailSecrets
  alias Operately.SystemSettings.Settings
  alias OperatelyEmail.Mailers.Config.TLS

  def configured? do
    case config() do
      {:ok, _} -> true
      :not_configured -> false
    end
  end

  def config do
    case settings() do
      %Settings{} = settings -> build_config(settings.email_config, settings.email_secrets)
      _ -> :not_configured
    end
  end

  defp settings do
    try do
      Cache.get()
    rescue
      _ -> nil
    end
  end

  defp build_config(%EmailConfig{} = email_config, %EmailSecrets{} = email_secrets) do
    case email_config.provider do
      :sendgrid -> sendgrid_config(email_secrets)
      :smtp -> smtp_config(email_config, email_secrets)
      _ -> :not_configured
    end
  end

  defp build_config(_, _), do: :not_configured

  defp sendgrid_config(%EmailSecrets{} = email_secrets) do
    api_key = email_secrets.sendgrid_api_key

    if present?(api_key) do
      {:ok,
       [
         adapter: Swoosh.Adapters.Sendgrid,
         api_key: api_key
       ]}
    else
      :not_configured
    end
  end

  defp smtp_config(%EmailConfig{} = email_config, %EmailSecrets{} = email_secrets) do
    host = email_config.smtp_host
    port = parse_port(email_config.smtp_port)
    username = email_config.smtp_username
    password = email_secrets.smtp_password
    ssl = truthy?(email_config.smtp_ssl)

    tls_required = truthy?(email_config.smtp_tls_required)

    if present?(host) and present?(username) and present?(password) and port do
      base_config = [
        adapter: Swoosh.Adapters.SMTP,
        relay: host,
        port: port,
        username: username,
        password: password,
        ssl: ssl,
        tls: if(tls_required, do: :always, else: :if_available),
        auth: :always,
        retries: 2
      ]

      config =
        if tls_required do
          Keyword.put(base_config, :tls_options, TLS.options(host))
        else
          base_config
        end

      {:ok, config}
    else
      :not_configured
    end
  end

  defp parse_port(nil), do: nil
  defp parse_port(value) when is_integer(value), do: value

  defp parse_port(value) when is_binary(value) do
    case Integer.parse(value) do
      {int, _} -> int
      :error -> nil
    end
  end

  defp parse_port(_), do: nil

  defp truthy?(value) when value in [true, "true", "1", 1, "yes", "on"], do: true
  defp truthy?(_), do: false

  defp present?(value) when is_binary(value), do: String.trim(value) != ""
  defp present?(value), do: not is_nil(value)
end
