defmodule Operately.Features.SmtpEmailDeliveryTest do
  use Operately.FeatureCase

  alias Operately.Support.Factory

  @moduletag :smtp_e2e

  setup ctx do
    # Store original environment variables to restore after test
    original_env = %{
      smtp_server: System.get_env("SMTP_SERVER"),
      smtp_port: System.get_env("SMTP_PORT"),
      smtp_username: System.get_env("SMTP_USERNAME"),
      smtp_password: System.get_env("SMTP_PASSWORD"),
      smtp_ssl: System.get_env("SMTP_SSL"),
      app_env: Application.get_env(:operately, :app_env)
    }

    # Check if MailHog is running before proceeding
    case mailhog_available?() do
      true -> 
        :ok
      false -> 
        ExUnit.configure(exclude: [:smtp_e2e])
        :skip
    end

    # Configure application to use production-like SMTP behavior
    Application.put_env(:operately, :app_env, :prod)
    
    # Configure SMTP to use MailHog
    System.put_env("SMTP_SERVER", "127.0.0.1")
    System.put_env("SMTP_PORT", "1025")
    System.put_env("SMTP_USERNAME", "")
    System.put_env("SMTP_PASSWORD", "")
    System.put_env("SMTP_SSL", "false")

    # Clear SendGrid key to force SMTP usage
    System.delete_env("SENDGRID_API_KEY")

    # Clear any existing emails in MailHog
    clear_mailhog_emails()

    on_exit(fn ->
      # Restore original environment
      restore_env_vars(original_env)
      Application.put_env(:operately, :app_env, original_env.app_env)
    end)

    ctx
  end

  @tag :smtp_e2e
  feature "password reset emails are delivered through SMTP server", ctx do
    # Create an account to reset password for
    account = Factory.insert(:account, email: "smtp-test@example.com")
    token = "test-reset-token-#{:erlang.unique_integer()}"

    # Send the password reset email through SMTP
    OperatelyEmail.Emails.ResetPasswordEmail.send(account, token)

    # Wait for email delivery
    Process.sleep(2000)

    # Verify email was received by MailHog
    emails = get_mailhog_emails()
    assert length(emails) > 0, "No emails found in MailHog after sending password reset email"

    reset_email = Enum.find(emails, fn email ->
      recipients = get_in(email, ["To"]) || []
      Enum.any?(recipients, fn recipient ->
        String.contains?(recipient["Address"], "smtp-test@example.com")
      end)
    end)

    assert reset_email != nil, "Password reset email not found for smtp-test@example.com"
    
    # Verify subject contains password reset text
    subject = get_in(reset_email, ["Content", "Headers", "Subject"]) || []
    assert Enum.any?(subject, fn s -> String.contains?(String.downcase(s), "reset") end),
           "Email subject should contain 'reset'"

    # Verify email body contains the reset token
    body_content = get_in(reset_email, ["Content", "Body"]) || ""
    assert String.contains?(body_content, token), "Email body should contain the reset token"
  end

  @tag :smtp_e2e 
  feature "assignment emails are delivered through SMTP server", ctx do
    # Create a user with overdue project check-in
    person = Factory.insert(:person, email: "assignments-test@example.com")
    company = person.company
    
    # Create project with overdue check-in
    one_hour_ago = DateTime.utc_now() |> DateTime.add(-1, :hour)
    
    {:ok, project} = Operately.Projects.create_project(%{
      company_id: company.id,
      name: "SMTP Test Project",
      champion_id: person.id,
      reviewer_id: person.id,
      creator_id: person.id,
      next_check_in_scheduled_at: one_hour_ago
    })
    
    person_with_account = Operately.Repo.preload(person, :account)
    
    # Send assignment email
    OperatelyEmail.Emails.AssignmentsEmail.send(person_with_account)
    
    # Wait for email delivery
    Process.sleep(2000)
    
    # Verify email was received by MailHog
    emails = get_mailhog_emails()
    assert length(emails) > 0, "No emails found in MailHog after sending assignment email"
    
    assignment_email = Enum.find(emails, fn email ->
      recipients = get_in(email, ["To"]) || []
      Enum.any?(recipients, fn recipient ->
        String.contains?(recipient["Address"], "assignments-test@example.com")
      end)
    end)
    
    assert assignment_email != nil, "Assignment email not found for assignments-test@example.com"

    # Verify subject mentions the project
    subject = get_in(assignment_email, ["Content", "Headers", "Subject"]) || []
    assert Enum.any?(subject, fn s -> String.contains?(s, "SMTP Test Project") end),
           "Email subject should mention the project name"
  end

  @tag :smtp_e2e
  feature "SMTP configuration is properly used instead of SendGrid", ctx do
    # Verify that BaseMailer correctly detects SMTP configuration
    assert System.get_env("SMTP_SERVER") == "127.0.0.1"
    assert System.get_env("SENDGRID_API_KEY") == nil
    
    # Test that SMTP is selected as the adapter
    # Create a simple test email to verify the configuration works
    account = Factory.insert(:account, email: "config-test@example.com")
    
    # This should not raise an error when using SMTP
    assert_no_error(fn ->
      OperatelyEmail.Emails.ResetPasswordEmail.send(account, "test-token")
    end)
    
    # Wait for delivery and verify it worked
    Process.sleep(2000)
    emails = get_mailhog_emails()
    
    config_email = Enum.find(emails, fn email ->
      recipients = get_in(email, ["To"]) || []
      Enum.any?(recipients, fn recipient ->
        String.contains?(recipient["Address"], "config-test@example.com")
      end)
    end)
    
    assert config_email != nil, "Email should be delivered via SMTP configuration"
  end

  # Helper functions

  defp mailhog_available?() do
    case Req.get("http://127.0.0.1:8025/api/v2/messages") do
      {:ok, %Req.Response{status: 200}} -> true
      _ -> false
    end
  rescue
    _ -> false
  end

  defp clear_mailhog_emails() do
    case Req.delete("http://127.0.0.1:8025/api/v1/messages") do
      {:ok, _} -> :ok
      _ -> :ok  # Ignore errors when clearing
    end
  rescue
    _ -> :ok
  end

  defp get_mailhog_emails() do
    case Req.get("http://127.0.0.1:8025/api/v2/messages") do
      {:ok, %Req.Response{status: 200, body: body}} ->
        case body do
          %{"items" => emails} -> emails
          _ -> []
        end
      _ -> []
    end
  rescue
    _ -> []
  end

  defp restore_env_vars(original_env) do
    Enum.each(original_env, fn 
      {key, nil} when key != :app_env ->
        env_key = key |> Atom.to_string() |> String.upcase()
        System.delete_env(env_key)
      {key, value} when key != :app_env ->
        env_key = key |> Atom.to_string() |> String.upcase()
        System.put_env(env_key, value)
      _ ->
        :ok
    end)
  end

  defp assert_no_error(fun) do
    try do
      fun.()
      # If we get here, no error was raised
      assert true
    rescue
      error ->
        flunk("Expected no error, but got: #{inspect(error)}")
    end
  end
end