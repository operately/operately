defmodule OperatelyEE.AdminApi.Queries.GetEmailSettingsTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.SystemSettings
  alias Operately.SystemSettings.Cache
  alias Operately.SystemSettings.EmailSecrets
  alias Operately.SystemSettings.Encryption

  defp clear_key_cache do
    :persistent_term.erase({Encryption, :keys})
  end

  setup do
    System.put_env("SYSTEM_SETTINGS_ENCRYPTION_KEY", "test-encryption-key")
    clear_key_cache()

    on_exit(fn ->
      System.delete_env("SYSTEM_SETTINGS_ENCRYPTION_KEY")
      System.delete_env("SYSTEM_SETTINGS_ENCRYPTION_KEYS")
      clear_key_cache()
    end)

    :ok
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_email_settings, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_email_settings, %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "it returns empty settings when not configured", ctx do
      Cache.clear()
      refute SystemSettings.get()

      assert {200, %{email_settings: email_settings}} = admin_query(ctx.conn, :get_email_settings, %{})
      assert email_settings == %{}
    end

    test "it returns smtp settings", ctx do
      {:ok, _settings} =
        SystemSettings.upsert(%{
          email_config: %{
            provider: :smtp,
            notification_email: "noreply@example.com",
            smtp_host: "smtp.example.com",
            smtp_port: 587,
            smtp_username: "user@example.com",
            smtp_ssl: true,
            smtp_tls_required: true
          },
          email_secrets: %{
            smtp_password: "secret"
          }
        })

      Cache.clear()

      assert {200, %{email_settings: email_settings}} = admin_query(ctx.conn, :get_email_settings, %{})

      assert email_settings.provider == "smtp"
      assert email_settings.notification_email == "noreply@example.com"
      assert email_settings.smtp.host == "smtp.example.com"
      assert email_settings.smtp.port == 587
      assert email_settings.smtp.username == "user@example.com"
      assert email_settings.smtp.ssl == true
      assert email_settings.smtp.tls_required == true
      assert email_settings.smtp.smtp_password_set == true
    end

    test "it returns sendgrid settings", ctx do
      {:ok, _settings} =
        SystemSettings.upsert(%{
          email_config: %{provider: :sendgrid, notification_email: "noreply@example.com"},
          email_secrets: %{
            sendgrid_api_key: "sg-api-key"
          }
        })

      Cache.clear()

      assert {200, %{email_settings: email_settings}} = admin_query(ctx.conn, :get_email_settings, %{})

      assert email_settings.provider == "sendgrid"
      assert email_settings.notification_email == "noreply@example.com"
      assert email_settings.sendgrid_api_key_set == true
      assert email_settings.smtp.smtp_password_set == false
      assert email_settings.smtp.host == nil
      assert email_settings.smtp.port == nil
      assert email_settings.smtp.username == nil
      assert email_settings.smtp.ssl == false
      assert email_settings.smtp.tls_required == false
    end

    test "it sets smtp_password_set to false when missing", ctx do
      {:ok, _settings} =
        SystemSettings.upsert(%{
          email_config: %{
            provider: :smtp,
            smtp_host: "smtp.example.com",
            smtp_port: 587,
            smtp_username: "user@example.com",
            smtp_ssl: false,
            smtp_tls_required: false
          },
          email_secrets: %EmailSecrets{}
        })

      Cache.clear()

      assert {200, %{email_settings: email_settings}} = admin_query(ctx.conn, :get_email_settings, %{})

      assert email_settings.smtp.smtp_password_set == false
    end
  end
end
