defmodule OperatelyEE.AdminApi.Mutations.UpdateEmailSettingsTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.SystemSettings
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
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :update_email_settings, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :update_email_settings, %{})
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

    test "it saves smtp settings and secrets", ctx do
      refute SystemSettings.get()

      assert {200, %{success: true, email_settings: email_settings}} =
               admin_mutation(ctx.conn, :update_email_settings, %{
                 provider: "smtp",
                 smtp_host: "smtp.example.com",
                 smtp_port: 587,
                 smtp_username: "user@example.com",
                 smtp_password: "secret",
                 smtp_ssl: true,
                 smtp_tls_required: true
               })

      assert email_settings.provider == "smtp"
      assert email_settings.smtp.host == "smtp.example.com"
      assert email_settings.smtp.port == 587
      assert email_settings.smtp.username == "user@example.com"
      assert email_settings.smtp.ssl == true
      assert email_settings.smtp.tls_required == true
      assert email_settings.smtp.smtp_password_set == true

      settings = SystemSettings.get!()
      assert settings.email_config.provider == :smtp
      assert settings.email_config.smtp_host == "smtp.example.com"
      assert settings.email_config.smtp_port == 587
      assert settings.email_config.smtp_username == "user@example.com"
      assert settings.email_config.smtp_ssl == true
      assert settings.email_config.smtp_tls_required == true
      assert settings.email_secrets == %EmailSecrets{smtp_password: "secret", sendgrid_api_key: nil}
    end

    test "it saves sendgrid settings and secrets", ctx do
      refute SystemSettings.get()

      assert {200, %{success: true, email_settings: email_settings}} =
               admin_mutation(ctx.conn, :update_email_settings, %{
                 provider: "sendgrid",
                 sendgrid_api_key: "sg-api-key"
               })

      assert email_settings.provider == "sendgrid"
      assert email_settings.sendgrid_api_key_set == true

      settings = SystemSettings.get!()
      assert settings.email_config.provider == :sendgrid
      assert settings.email_secrets == %EmailSecrets{smtp_password: nil, sendgrid_api_key: "sg-api-key"}
    end

    test "it rejects invalid providers", ctx do
      _ = String.to_atom("mailgun")

      assert {400, %{error: "Bad request", message: message}} =
               admin_mutation(ctx.conn, :update_email_settings, %{
                 provider: "mailgun"
               })

      assert message =~ "Invalid value for enum email_provider"
    end
  end
end
