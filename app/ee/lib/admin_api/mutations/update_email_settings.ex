defmodule OperatelyEE.AdminApi.Mutations.UpdateEmailSettings do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.People.Account
  alias Operately.SystemSettings
  alias Operately.SystemSettings.Cache
  alias Operately.SystemSettings.EmailConfig
  alias Operately.SystemSettings.EmailSecrets
  alias Operately.SystemSettings.Settings

  inputs do
    field :provider, :email_provider, null: false
    field? :smtp_host, :string, null: false
    field? :smtp_port, :integer, null: false
    field? :smtp_username, :string, null: false
    field? :smtp_password, :string, null: false
    field? :smtp_ssl, :boolean, null: false
    field? :smtp_tls_required, :boolean, null: false
    field? :sendgrid_api_key, :string, null: false
  end

  outputs do
    field :success, :boolean, null: false
    field? :error, :string, null: false
    field? :email_settings, :email_settings, null: false
  end

  def call(conn, inputs) do
    with {:ok, account} <- find_account(conn),
         true <- Account.is_site_admin?(account) || {:error, :forbidden},
         {:ok, settings} <- update_settings(inputs) do
      Cache.refresh()
      {:ok, %{success: true, email_settings: serialize(settings)}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, %Ecto.Changeset{} = changeset} -> {:ok, %{success: false, error: changeset_error(changeset)}}
      {:error, reason} -> {:ok, %{success: false, error: inspect(reason)}}
    end
  end

  defp update_settings(inputs) do
    settings = SystemSettings.get()
    email_config = (settings && settings.email_config) || %EmailConfig{}
    email_secrets = (settings && settings.email_secrets) || %EmailSecrets{}

    email_config =
      %{
        provider: email_config.provider,
        smtp_host: email_config.smtp_host,
        smtp_port: email_config.smtp_port,
        smtp_username: email_config.smtp_username,
        smtp_ssl: email_config.smtp_ssl,
        smtp_tls_required: email_config.smtp_tls_required
      }
      |> put_if_provided(:provider, Map.get(inputs, :provider))
      |> put_if_provided(:smtp_host, Map.get(inputs, :smtp_host))
      |> put_if_provided(:smtp_port, Map.get(inputs, :smtp_port))
      |> put_if_provided(:smtp_username, Map.get(inputs, :smtp_username))
      |> put_if_provided(:smtp_ssl, Map.get(inputs, :smtp_ssl))
      |> put_if_provided(:smtp_tls_required, Map.get(inputs, :smtp_tls_required))

    email_secrets =
      %{
        sendgrid_api_key: email_secrets.sendgrid_api_key,
        smtp_password: email_secrets.smtp_password
      }
      |> put_if_provided(:smtp_password, Map.get(inputs, :smtp_password))
      |> put_if_provided(:sendgrid_api_key, Map.get(inputs, :sendgrid_api_key))

    SystemSettings.upsert(%{email_config: email_config, email_secrets: email_secrets})
  end

  defp serialize(%Settings{} = settings) do
    email_config = settings.email_config || %EmailConfig{}
    email_secrets = settings.email_secrets || %EmailSecrets{}

    %{
      provider: email_config.provider,
      smtp: %{
        host: email_config.smtp_host,
        port: email_config.smtp_port,
        username: email_config.smtp_username,
        ssl: truthy?(email_config.smtp_ssl),
        tls_required: truthy?(email_config.smtp_tls_required),
        smtp_password_set: present?(email_secrets.smtp_password)
      },
      sendgrid_api_key_set: present?(email_secrets.sendgrid_api_key)
    }
  end

  defp serialize(_), do: %{}

  defp put_if_provided(map, _key, nil), do: map
  defp put_if_provided(map, key, value), do: Map.put(map, key, value)

  defp present?(value) when is_binary(value), do: String.trim(value) != ""
  defp present?(value), do: not is_nil(value)

  defp truthy?(value) when value in [true, "true", "1", 1, "yes", "on"], do: true
  defp truthy?(_), do: false

  defp changeset_error(changeset) do
    {message, _opts} = changeset.errors |> List.first() || {"Invalid settings", []}
    message
  end
end
