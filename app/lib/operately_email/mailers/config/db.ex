defmodule OperatelyEmail.Mailers.Config.Db do
  @moduledoc false

  alias Operately.SystemSettings.Cache
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
      %Settings{} = settings -> build_config(settings.data || %{}, settings.secrets || %{})
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

  defp build_config(data, secrets) do
    email_data = get_value(data, :email) || %{}
    email_secrets = get_value(secrets, :email) || %{}

    case get_value(email_data, :provider) do
      "sendgrid" -> sendgrid_config(email_data, email_secrets)
      "smtp" -> smtp_config(email_data, email_secrets)
      _ -> :not_configured
    end
  end

  defp sendgrid_config(email_data, email_secrets) do
    api_key = get_value(email_secrets, :sendgrid_api_key) || get_value(email_data, :sendgrid_api_key)

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

  defp smtp_config(email_data, email_secrets) do
    smtp_data = get_value(email_data, :smtp) || %{}

    host = get_value(smtp_data, :host) || get_value(smtp_data, :server) || get_value(email_data, :smtp_server)
    port = parse_port(get_value(smtp_data, :port) || get_value(email_data, :smtp_port))
    username = get_value(smtp_data, :username) || get_value(email_data, :smtp_username)
    password = get_value(email_secrets, :smtp_password) || get_value(email_secrets, :password)
    ssl = truthy?(get_value(smtp_data, :ssl) || get_value(email_data, :smtp_ssl))

    tls_required = truthy?(get_value(smtp_data, :tls_required) || get_value(smtp_data, :tls))

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

  defp get_value(map, key) when is_map(map) do
    Map.get(map, key) || Map.get(map, to_string(key))
  end

  defp get_value(_map, _key), do: nil

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
