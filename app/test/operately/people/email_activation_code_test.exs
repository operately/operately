defmodule Operately.People.EmailActivationCodeTest do
  use Operately.DataCase

  import Swoosh.TestAssertions
  alias Operately.People.EmailActivationCode

  describe "creation" do
    test "creates a six-character code with the supplied analytics context" do
      analytics_context = %{channel: "web", preference: "granted"}
      {:ok, code} = EmailActivationCode.create("hello@text.localhost", analytics_context)

      assert String.length(code.code) == 6
      assert Repo.get!(EmailActivationCode, code.id).analytics_context == %{"channel" => "web", "preference" => "granted"}
    end

    test "accepts an email at the 255-code-point storage limit" do
      email = String.duplicate("a", 243) <> "@example.com"

      assert {:ok, code} = EmailActivationCode.create(email)
      assert code.email == email
      assert Repo.get!(EmailActivationCode, code.id).email == email
      assert_email_sent(to: email)
    end

    test "rejects an email one code point beyond the storage limit" do
      email = String.duplicate("a", 244) <> "@example.com"

      assert {:error, %Ecto.Changeset{} = changeset} = EmailActivationCode.create(email)
      assert {_, options} = changeset.errors[:email]
      assert options[:validation] == :length
      assert options[:count] == 255
      assert Repo.aggregate(EmailActivationCode, :count) == 0
      assert_no_email_sent()
    end

    test "counts Unicode code points rather than graphemes" do
      email = String.duplicate("a\u0301", 122) <> "@example.com"
      assert String.length(email) < 255
      assert length(String.codepoints(email)) == 256

      assert {:error, %Ecto.Changeset{} = changeset} = EmailActivationCode.create(email)
      assert {_, options} = changeset.errors[:email]
      assert options[:validation] == :length
      assert Repo.aggregate(EmailActivationCode, :count) == 0
      assert_no_email_sent()
    end

    for {label, email} <- [{"null", nil}, {"blank", "   "}, {"malformed", "invalid"}] do
      test "returns an invalid changeset for #{label} email" do
        assert {:error, %Ecto.Changeset{valid?: false} = changeset} = EmailActivationCode.create(unquote(email))
        assert changeset.errors[:email]
        assert Repo.aggregate(EmailActivationCode, :count) == 0
        assert_no_email_sent()
      end
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

  test "signup delivery stores the normalized address" do
    assert {:ok, activation} = Operately.People.EmailActivationCode.create_for_signup("  Signup@Example.com  ", %{})
    assert activation.email == "signup@example.com"
    assert {:error, :rate_limited} = Operately.People.EmailActivationCode.create_for_signup("SIGNUP@EXAMPLE.COM", %{})
  end
end
