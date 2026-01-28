defmodule OperatelyEE.AdminApi.Queries.GetEmailSettings do
  use TurboConnect.Query

  require Logger

  alias Operately.SystemSettings.Cache
  alias Operately.SystemSettings.EmailConfig
  alias Operately.SystemSettings.EmailSecrets
  alias Operately.SystemSettings.Settings

  outputs do
    field :email_settings, :email_settings
  end

  def call(_conn, _inputs) do
    {:ok, %{email_settings: build_email_settings(load_settings())}}
  end

  defp load_settings do
    try do
      Cache.get()
    rescue
      error ->
        Logger.error("Failed to load system settings cache: #{Exception.message(error)}")
        nil
    end
  end

  defp build_email_settings(%Settings{} = settings) do
    email_config = settings.email_config || %EmailConfig{}
    email_secrets = settings.email_secrets || %EmailSecrets{}

    %{
      provider: email_config.provider,
      notification_email: email_config.notification_email,
      smtp: %{
        host: email_config.smtp_host,
        port: parse_port(email_config.smtp_port),
        username: email_config.smtp_username,
        ssl: truthy?(email_config.smtp_ssl),
        tls_required: truthy?(email_config.smtp_tls_required),
        smtp_password_set: present?(email_secrets.smtp_password)
      },
      sendgrid_api_key_set: present?(email_secrets.sendgrid_api_key)
    }
  end

  defp build_email_settings(_), do: %{}

  defp parse_port(nil), do: nil
  defp parse_port(value) when is_integer(value), do: value

  defp parse_port(value) when is_binary(value) do
    case Integer.parse(value) do
      {int, _} -> int
      :error -> nil
    end
  end

  defp parse_port(_), do: nil

  defp present?(value) when is_binary(value), do: String.trim(value) != ""
  defp present?(value), do: not is_nil(value)

  defp truthy?(value) when value in [true, "true", "1", 1, "yes", "on"], do: true
  defp truthy?(_), do: false
end
