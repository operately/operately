defmodule Operately.People.EmailActivationCodeTest do
  use Operately.DataCase

  describe "creation" do
    test "it creates a 6 digit code" do
      {:ok, code} = Operately.People.EmailActivationCode.create("hello@text.localhost")

      assert String.length(code.code) == 6
    end

    test "it returns an error when email delivery is not configured" do
      original_env = Application.get_env(:operately, :app_env)
      original_sendgrid = System.get_env("SENDGRID_API_KEY")
      original_smtp_server = System.get_env("SMTP_SERVER")

      on_exit(fn ->
        Application.put_env(:operately, :app_env, original_env)
        restore_env("SENDGRID_API_KEY", original_sendgrid)
        restore_env("SMTP_SERVER", original_smtp_server)
      end)

      Application.put_env(:operately, :app_env, :prod)
      System.delete_env("SENDGRID_API_KEY")
      System.delete_env("SMTP_SERVER")

      assert {:error, :email_delivery_not_configured} =
               Operately.People.EmailActivationCode.create("hello@text.localhost")
    end
  end

  defp restore_env(key, nil), do: System.delete_env(key)
  defp restore_env(key, value), do: System.put_env(key, value)
end
