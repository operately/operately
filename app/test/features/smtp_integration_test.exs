defmodule Operately.Features.SmtpIntegrationTest do
  use Operately.FeatureCase
  
  import Operately.Support.Factory

  @moduletag :smtp_integration

  setup ctx do
    # Check if MailHog is running before proceeding
    case mailhog_available?() do
      true -> :ok
      false -> 
        ExUnit.configure(exclude: [:smtp_integration])
        :skip
    end

    # Store original environment variables
    original_env = %{
      smtp_server: System.get_env("SMTP_SERVER"),
      smtp_port: System.get_env("SMTP_PORT"), 
      smtp_username: System.get_env("SMTP_USERNAME"),
      smtp_password: System.get_env("SMTP_PASSWORD"),
      smtp_tls: System.get_env("SMTP_TLS"),
      smtp_ssl: System.get_env("SMTP_SSL"),
      dev_routes: Application.get_env(:operately, :dev_routes),
      test_routes: Application.get_env(:operately, :test_routes)
    }

    # Configure for SMTP testing
    Application.put_env(:operately, :dev_routes, false)
    Application.put_env(:operately, :test_routes, false)
    
    # Configure SMTP to use MailHog
    System.put_env("SMTP_SERVER", "127.0.0.1")
    System.put_env("SMTP_PORT", "1025") 
    System.put_env("SMTP_USERNAME", "")
    System.put_env("SMTP_PASSWORD", "")
    System.put_env("SMTP_TLS", "false")
    System.put_env("SMTP_SSL", "false")

    # Clear any existing emails in MailHog
    clear_mailhog_emails()

    on_exit(fn ->
      restore_env_vars(original_env)
      Application.put_env(:operately, :dev_routes, original_env.dev_routes)
      Application.put_env(:operately, :test_routes, original_env.test_routes)
    end)

    ctx = create_test_user(ctx)
    
    ctx
  end

  @tag :smtp_integration
  feature "password reset emails are delivered through SMTP to MailHog", ctx do
    # Create account and send password reset email
    account = insert(:account, email: "test-smtp@example.com")
    token = "test-reset-token-smtp"

    # Send the email
    OperatelyEmail.Emails.ResetPasswordEmail.send(account, token)

    # Wait for email delivery
    Process.sleep(3000)

    # Verify email was received by MailHog
    emails = get_mailhog_emails()
    assert length(emails) > 0, "No emails found in MailHog after sending password reset email"

    reset_email = Enum.find(emails, fn email ->
      recipients = get_in(email, ["To"]) || []
      Enum.any?(recipients, fn recipient ->
        String.contains?(recipient["Address"], "test-smtp@example.com")
      end)
    end)

    assert reset_email != nil, "Password reset email not found for test-smtp@example.com"
    
    # Verify subject
    subject = get_in(reset_email, ["Content", "Headers", "Subject"]) || []
    assert Enum.any?(subject, fn s -> String.contains?(s, "Reset password") end)
  end

  @tag :smtp_integration 
  feature "assignment emails are delivered through SMTP to MailHog", ctx do
    # Create project with overdue check-in
    one_hour_ago = DateTime.utc_now() |> DateTime.add(-1, :hour)
    
    _project = create_project(ctx.user, %{
      name: "SMTP Test Project",
      next_check_in_scheduled_at: one_hour_ago
    })
    
    user_with_account = Operately.Repo.preload(ctx.user, :account)
    
    # Send assignment email
    OperatelyEmail.Emails.AssignmentsEmail.send(user_with_account)
    
    # Wait for email delivery
    Process.sleep(3000)
    
    # Verify email was received by MailHog
    emails = get_mailhog_emails()
    assert length(emails) > 0, "No emails found in MailHog after sending assignment email"
    
    assignment_email = Enum.find(emails, fn email ->
      recipients = get_in(email, ["To"]) || []
      Enum.any?(recipients, fn recipient ->
        String.contains?(recipient["Address"], ctx.user.email)
      end)
    end)
    
    assert assignment_email != nil, "Assignment email not found for #{ctx.user.email}"
  end

  # Helper functions

  defp create_test_user(ctx) do
    user = insert(:person, email: "smtp-test-user@example.com")
    Map.put(ctx, :user, user)
  end

  defp create_project(user, attrs) do
    company = user.company
    
    {:ok, project} = Operately.Projects.create_project(%{
      company_id: company.id,
      name: attrs.name,
      champion_id: user.id,
      reviewer_id: user.id,
      creator_id: user.id,
      next_check_in_scheduled_at: attrs.next_check_in_scheduled_at
    })

    project
  end

  defp restore_env_vars(original_env) do
    Enum.each(original_env, fn 
      {key, nil} when key not in [:dev_routes, :test_routes] ->
        System.delete_env(key |> Atom.to_string() |> String.upcase())
      {key, value} when key not in [:dev_routes, :test_routes] ->
        System.put_env(key |> Atom.to_string() |> String.upcase(), value)
      _ ->
        :ok
    end)
  end

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
end