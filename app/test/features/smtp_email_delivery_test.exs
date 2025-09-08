defmodule Operately.Features.SmtpEmailDeliveryTest do
  use Operately.DataCase

  import Operately.PeopleFixtures

  setup do
    original_env = %{
      smtp_server: System.get_env("SMTP_SERVER"),
      smtp_port: System.get_env("SMTP_PORT"),
      smtp_username: System.get_env("SMTP_USERNAME"),
      smtp_password: System.get_env("SMTP_PASSWORD"),
      smtp_ssl: System.get_env("SMTP_SSL"),
      e2e_email_test: System.get_env("E2E_EMAIL_TEST")
    }

    new_env = %{
      smtp_server: "mailhog",
      smtp_port: "1025",
      smtp_username: "",
      smtp_password: "",
      smtp_ssl: "false",
      e2e_email_test: "true"
    }

    set_env_vars(new_env)
    clear_mailhog_emails()

    on_exit(fn ->
      set_env_vars(original_env)
    end)

    :ok
  end

  test "password reset emails are delivered through SMTP server" do
    # Create an account to reset password for
    account = account_fixture(%{email: "smtp-test@example.com"})
    token = "test-reset-token-#{:erlang.unique_integer()}"

    # Send the password reset email through SMTP
    OperatelyEmail.Emails.ResetPasswordEmail.send(account, token)

    # Wait for email delivery
    Process.sleep(2000)

    # Verify email was received by MailHog
    emails = get_mailhog_emails()
    assert length(emails) > 0, "No emails found in MailHog after sending password reset email"

    reset_email = Enum.find(emails, fn email -> "smtp-test@example.com" in email["Raw"]["To"] end)
    assert reset_email != nil, "Password reset email not found for smtp-test@example.com"

    # Verify subject contains password reset text
    subject = get_in(reset_email, ["Content", "Headers", "Subject"]) || []
    with_reset = Enum.filter(subject, fn s -> String.contains?(String.downcase(s), "reset") end)
    assert length(with_reset) > 0, "Email subject should contain 'reset'"
  end

  defp clear_mailhog_emails() do
    case Req.delete("http://mailhog:8025/api/v1/messages") do
      {:ok, _} -> :ok
      _ -> :ok
    end
  end

  defp get_mailhog_emails() do
    case Req.get("http://mailhog:8025/api/v2/messages") do
      {:ok, %Req.Response{status: 200, body: body}} ->
        {:ok, response} = Jason.decode(body)
        response["items"]

      _ ->
        []
    end
  end

  defp set_env_vars(original_env) do
    Enum.each(original_env, fn
      {key, nil} ->
        env_key = key |> Atom.to_string() |> String.upcase()
        System.delete_env(env_key)

      {key, value} ->
        env_key = key |> Atom.to_string() |> String.upcase()
        System.put_env(env_key, value)
    end)
  end
end
