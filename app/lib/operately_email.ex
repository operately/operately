defmodule OperatelyEmail do
  alias Operately.SystemSettings.Cache
  alias Operately.SystemSettings.EmailConfig
  alias Operately.SystemSettings.Settings

  def sender(company), do: {sender_name(company), notification_email_address()}
  def sender_name(company), do: "Operately (#{company.name})"

  def notification_email_address do
    settings_email = load_notification_email()

    if present?(settings_email) do
      settings_email
    else
      Application.get_env(:operately, :notification_email)
    end
  end

  defp load_notification_email do
    try do
      case Cache.get() do
        %Settings{email_config: %EmailConfig{notification_email: value}} -> value
        _ -> nil
      end
    rescue
      _ -> nil
    end
  end

  defp present?(value) when is_binary(value), do: String.trim(value) != ""
  defp present?(_), do: false
end
