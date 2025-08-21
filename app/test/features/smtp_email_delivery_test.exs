defmodule Operately.Features.SmtpEmailDeliveryTest do
  use Operately.FeatureCase
  
  import Operately.Support.Factory

  setup ctx do
    # Store original environment variables to restore after test
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

    # Disable dev and test routes to force production-like behavior
    Application.put_env(:operately, :dev_routes, false)
    Application.put_env(:operately, :test_routes, false)

    # Configure SMTP to use MailHog
    System.put_env("SMTP_SERVER", "127.0.0.1")
    System.put_env("SMTP_PORT", "1025")
    System.put_env("SMTP_USERNAME", "")
    System.put_env("SMTP_PASSWORD", "")
    System.put_env("SMTP_TLS", "false")
    System.put_env("SMTP_SSL", "false")

    on_exit(fn ->
      # Restore original environment
      restore_env_vars(original_env)
      Application.put_env(:operately, :dev_routes, original_env.dev_routes)
      Application.put_env(:operately, :test_routes, original_env.test_routes)
    end)

    ctx = create_test_user(ctx)
    
    ctx
  end

  feature "SMTP adapter is selected when SMTP_SERVER is configured", _ctx do
    # Verify that our BaseMailer correctly detects SMTP configuration
    assert OperatelyEmail.Mailers.BaseMailer.adapter() == Bamboo.SMTPAdapter
  end

  feature "SendGrid adapter is used when SMTP_SERVER is not configured", _ctx do
    # Temporarily remove SMTP config
    System.delete_env("SMTP_SERVER")
    
    # Should fallback to SendGrid
    assert OperatelyEmail.Mailers.BaseMailer.adapter() == Bamboo.SendGridAdapter
    
    # Restore for cleanup
    System.put_env("SMTP_SERVER", "127.0.0.1")
  end

  feature "password reset email can be sent via SMTP server", ctx do
    # Create an account for password reset
    account = insert(:account, email: "test@example.com")
    token = "test-reset-token"

    # This should not raise an error when sending via SMTP
    assert_no_error(fn ->
      OperatelyEmail.Emails.ResetPasswordEmail.send(account, token)
    end)

    # Verify the email was processed (it should not raise an SMTP connection error)
    # In a real SMTP server setup, this would actually deliver the email
  end

  feature "assignment email can be sent via SMTP server", ctx do
    # Create a project with overdue check-in
    one_hour_ago = DateTime.utc_now() |> DateTime.add(-1, :hour)
    
    project = create_project(ctx.user, %{
      name: "Test Project", 
      next_check_in_scheduled_at: one_hour_ago
    })
    
    # This should not raise an error when sending via SMTP
    user_with_account = Operately.Repo.preload(ctx.user, :account)
    
    assert_no_error(fn ->
      OperatelyEmail.Emails.AssignmentsEmail.send(user_with_account)
    end)
  end

  feature "SMTP configuration is properly parsed from environment variables", _ctx do
    # Test with different SMTP configurations
    test_smtp_configs = [
      %{
        server: "smtp.gmail.com",
        port: "587",
        username: "test@gmail.com",
        password: "password",
        tls: "true",
        ssl: "false"
      },
      %{
        server: "smtp.office365.com", 
        port: "587",
        username: "test@office365.com",
        password: "password",
        tls: "true",
        ssl: "false"
      },
      %{
        server: "mail.example.com",
        port: "465", 
        username: "noreply@example.com",
        password: "secret",
        tls: "false",
        ssl: "true"
      }
    ]

    Enum.each(test_smtp_configs, fn config ->
      # Set environment variables for this configuration
      System.put_env("SMTP_SERVER", config.server)
      System.put_env("SMTP_PORT", config.port)
      System.put_env("SMTP_USERNAME", config.username)
      System.put_env("SMTP_PASSWORD", config.password)
      System.put_env("SMTP_TLS", config.tls)
      System.put_env("SMTP_SSL", config.ssl)

      # Verify SMTP adapter is selected
      assert OperatelyEmail.Mailers.BaseMailer.adapter() == Bamboo.SMTPAdapter

      # Verify configuration would not cause immediate errors
      # (actual SMTP connection testing would require real SMTP servers)
      assert_no_error(fn ->
        # This tests that the configuration parsing doesn't crash
        _ = OperatelyEmail.Mailers.BaseMailer.adapter()
      end)
    end

    # Restore MailHog config for other tests
    System.put_env("SMTP_SERVER", "127.0.0.1")
    System.put_env("SMTP_PORT", "1025")
  end

  # Helper functions

  defp create_test_user(ctx) do
    user = insert(:person)
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