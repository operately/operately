defmodule OperatelyEmail.Mailers.BaseMailerTest do
  use Operately.DataCase
  import Swoosh.TestAssertions
  import Mock

  alias OperatelyEmail.Mailers.BaseMailer
  alias Swoosh.Email

  describe "deliver_now/1" do
    test "delivers email in test environment" do
      email =
        Email.new()
        |> Email.to("test@example.com")
        |> Email.from("noreply@operately.com")
        |> Email.subject("Test Email")
        |> Email.html_body("<p>Hello World</p>")
        |> Email.text_body("Hello World")

      result = BaseMailer.deliver_now(email)

      assert {:ok, _} = result
      assert_email_sent(to: "test@example.com", subject: "Test Email")
    end

    test "uses test adapter configuration in test environment" do
      # Mock the application environment to ensure we're in test mode
      original_env = Application.get_env(:operately, :app_env)
      Application.put_env(:operately, :app_env, :test)

      try do
        email =
          Email.new()
          |> Email.to("test@example.com")
          |> Email.from("noreply@operately.com")
          |> Email.subject("Test Configuration")
          |> Email.html_body("<p>Test</p>")

        # The deliver_now function should work without errors in test environment
        assert {:ok, _} = BaseMailer.deliver_now(email)
      after
        Application.put_env(:operately, :app_env, original_env)
      end
    end
  end

  describe "configuration" do
    test "returns local adapter for dev environment" do
      original_env = Application.get_env(:operately, :app_env)
      Application.put_env(:operately, :app_env, :dev)

      try do
        # We can't directly test the private config function, but we can test
        # that it works by ensuring deliver_now works in dev mode
        email =
          Email.new()
          |> Email.to("dev@example.com")
          |> Email.from("noreply@operately.com")
          |> Email.subject("Dev Test")
          |> Email.html_body("<p>Dev Test</p>")

        # Should not raise an error
        assert {:ok, _} = BaseMailer.deliver_now(email)
      after
        Application.put_env(:operately, :app_env, original_env)
      end
    end

    test "returns test adapter for test environment" do
      # Test environment is the default for our tests
      email =
        Email.new()
        |> Email.to("test@example.com")
        |> Email.from("noreply@operately.com")
        |> Email.subject("Test Environment")
        |> Email.html_body("<p>Test</p>")

      assert {:ok, _} = BaseMailer.deliver_now(email)
      assert_email_sent(to: "test@example.com")
    end
  end

  describe "production configuration edge cases" do
    setup do
      # Store original environment values
      original_app_env = Application.get_env(:operately, :app_env)
      original_sendgrid_key = System.get_env("SENDGRID_API_KEY")
      original_smtp_server = System.get_env("SMTP_SERVER")

      on_exit(fn ->
        # Restore original environment
        Application.put_env(:operately, :app_env, original_app_env)
        if original_sendgrid_key, do: System.put_env("SENDGRID_API_KEY", original_sendgrid_key), else: System.delete_env("SENDGRID_API_KEY")
        if original_smtp_server, do: System.put_env("SMTP_SERVER", original_smtp_server), else: System.delete_env("SMTP_SERVER")
      end)

      :ok
    end

    test "raises error when no email configuration is found in production" do
      Application.put_env(:operately, :app_env, :prod)
      System.delete_env("SENDGRID_API_KEY")
      System.delete_env("SMTP_SERVER")

      email =
        Email.new()
        |> Email.to("prod@example.com")
        |> Email.from("noreply@operately.com")
        |> Email.subject("Prod Test")
        |> Email.html_body("<p>Prod Test</p>")

      assert_raise RuntimeError, "No valid email configuration found", fn ->
        BaseMailer.deliver_now(email)
      end
    end

    test "uses SendGrid configuration when SENDGRID_API_KEY is present" do
      Application.put_env(:operately, :app_env, :prod)
      System.put_env("SENDGRID_API_KEY", "test-key")
      System.delete_env("SMTP_SERVER")

      email =
        Email.new()
        |> Email.to("sendgrid@example.com")
        |> Email.from("noreply@operately.com")
        |> Email.subject("SendGrid Test")
        |> Email.html_body("<p>SendGrid Test</p>")

      # Mock the HTTP client to verify SendGrid API is called
      with_mock Swoosh.ApiClient, [:passthrough],
        post: fn _url, _headers, _body, _email ->
          {:ok, 202, [{"x-message-id", "test-message-id-123"}], ""}
        end do
        assert {:ok, %{id: "test-message-id-123"}} = BaseMailer.deliver_now(email)

        # Verify that the SendGrid API was called with correct parameters
        assert_called(
          Swoosh.ApiClient.post(
            ["https://api.sendgrid.com/v3", "/mail/send"],
            # Don't check exact headers order, just verify it was called
            :_,
            :_,
            email
          )
        )
      end
    end

    test "uses SMTP configuration when SMTP_SERVER is present" do
      Application.put_env(:operately, :app_env, :prod)
      System.delete_env("SENDGRID_API_KEY")
      System.put_env("SMTP_SERVER", "smtp.example.com")
      System.put_env("SMTP_PORT", "587")
      System.put_env("SMTP_USERNAME", "test@example.com")
      System.put_env("SMTP_PASSWORD", "password")

      email =
        Email.new()
        |> Email.to("smtp@example.com")
        |> Email.from("noreply@operately.com")
        |> Email.subject("SMTP Test")
        |> Email.html_body("<p>SMTP Test</p>")

      # Similar to SendGrid test - we validate configuration doesn't raise
      # "No valid email configuration found" error
      try do
        BaseMailer.deliver_now(email)
      rescue
        error ->
          refute String.contains?(Exception.message(error), "No valid email configuration found")
      end
    end

    test "prefers SendGrid over SMTP when both are configured" do
      Application.put_env(:operately, :app_env, :prod)
      System.put_env("SENDGRID_API_KEY", "test-key")
      System.put_env("SMTP_SERVER", "smtp.example.com")

      email =
        Email.new()
        |> Email.to("both@example.com")
        |> Email.from("noreply@operately.com")
        |> Email.subject("Both Configured Test")
        |> Email.html_body("<p>Both Test</p>")

      # Mock SendGrid API to verify it's used instead of SMTP
      with_mock Swoosh.ApiClient, [:passthrough],
        post: fn _url, _headers, _body, _email ->
          {:ok, 202, [{"x-message-id", "sendgrid-priority-test"}], ""}
        end do
        assert {:ok, %{id: "sendgrid-priority-test"}} = BaseMailer.deliver_now(email)

        # Verify SendGrid was called (not SMTP)
        assert_called(
          Swoosh.ApiClient.post(
            ["https://api.sendgrid.com/v3", "/mail/send"],
            # Don't check exact headers order, just verify SendGrid API was called
            :_,
            :_,
            email
          )
        )
      end
    end
  end

  describe "SendGrid adapter with mocked HTTP requests" do
    setup do
      # Store original environment values
      original_app_env = Application.get_env(:operately, :app_env)
      original_sendgrid_key = System.get_env("SENDGRID_API_KEY")
      original_smtp_server = System.get_env("SMTP_SERVER")

      # Set production environment with SendGrid configuration
      Application.put_env(:operately, :app_env, :prod)
      System.put_env("SENDGRID_API_KEY", "test-api-key-123")
      System.delete_env("SMTP_SERVER")

      on_exit(fn ->
        # Restore original environment
        Application.put_env(:operately, :app_env, original_app_env)
        if original_sendgrid_key, do: System.put_env("SENDGRID_API_KEY", original_sendgrid_key), else: System.delete_env("SENDGRID_API_KEY")
        if original_smtp_server, do: System.put_env("SMTP_SERVER", original_smtp_server), else: System.delete_env("SMTP_SERVER")
      end)

      :ok
    end

    test "successfully sends email via SendGrid API" do
      email =
        Email.new()
        |> Email.to("success@example.com")
        |> Email.from("sender@operately.com")
        |> Email.subject("SendGrid Success Test")
        |> Email.html_body("<h1>Test Email</h1><p>This is a test email sent via SendGrid.</p>")
        |> Email.text_body("Test Email\n\nThis is a test email sent via SendGrid.")

      # Mock successful SendGrid API response
      with_mock Swoosh.ApiClient, [:passthrough],
        post: fn url, headers, body, _email ->
          # Verify the URL is correct
          assert url == ["https://api.sendgrid.com/v3", "/mail/send"]

          # Verify authorization header is present
          auth_header = Enum.find(headers, fn {key, _} -> key == "Authorization" end)
          assert auth_header == {"Authorization", "Bearer test-api-key-123"}
          content_type_header = Enum.find(headers, fn {key, _} -> key == "Content-Type" end)
          assert content_type_header == {"Content-Type", "application/json"}

          # Verify body contains email data
          decoded_body = Jason.decode!(body)
          assert decoded_body["from"]["email"] == "sender@operately.com"
          assert decoded_body["subject"] == "SendGrid Success Test"
          assert length(decoded_body["personalizations"]) == 1
          assert hd(decoded_body["personalizations"])["to"] == [%{"email" => "success@example.com"}]

          # Return successful response
          {:ok, 202, [{"x-message-id", "sg.test.message.id.123"}], ""}
        end do
        assert {:ok, %{id: "sg.test.message.id.123"}} = BaseMailer.deliver_now(email)

        # Verify the API was called once
        assert_called_exactly(Swoosh.ApiClient.post(:_, :_, :_, :_), 1)
      end
    end

    test "handles SendGrid API error responses" do
      email =
        Email.new()
        |> Email.to("error@example.com")
        |> Email.from("sender@operately.com")
        |> Email.subject("SendGrid Error Test")
        |> Email.html_body("<p>This should fail</p>")

      # Mock SendGrid API error response
      with_mock Swoosh.ApiClient, [:passthrough],
        post: fn _url, _headers, _body, _email ->
          error_body =
            Jason.encode!(%{
              "errors" => [
                %{
                  "message" => "The from address does not match a verified Sender Identity",
                  "field" => "from.email",
                  "help" => "https://sendgrid.com/docs/for-developers/sending-email/sender-identity/"
                }
              ]
            })

          {:ok, 400, [], error_body}
        end do
        assert {:error, {400, %{"errors" => [error]}}} = BaseMailer.deliver_now(email)
        assert error["message"] == "The from address does not match a verified Sender Identity"
        assert error["field"] == "from.email"
      end
    end

    test "handles SendGrid API network errors" do
      email =
        Email.new()
        |> Email.to("network@example.com")
        |> Email.from("sender@operately.com")
        |> Email.subject("Network Error Test")
        |> Email.html_body("<p>Network failure</p>")

      # Mock network error
      with_mock Swoosh.ApiClient, [:passthrough],
        post: fn _url, _headers, _body, _email ->
          {:error, :timeout}
        end do
        assert {:error, :timeout} = BaseMailer.deliver_now(email)
      end
    end

    test "sends email with multiple recipients via SendGrid" do
      email =
        Email.new()
        |> Email.to(["recipient1@example.com", "recipient2@example.com"])
        |> Email.cc("cc@example.com")
        |> Email.bcc("bcc@example.com")
        |> Email.from("sender@operately.com")
        |> Email.subject("Multiple Recipients Test")
        |> Email.html_body("<p>Multiple recipients</p>")

      with_mock Swoosh.ApiClient, [:passthrough],
        post: fn _url, _headers, body, _email ->
          # Verify multiple recipients in the request body
          decoded_body = Jason.decode!(body)
          personalization = hd(decoded_body["personalizations"])

          assert length(personalization["to"]) == 2
          assert %{"email" => "recipient1@example.com"} in personalization["to"]
          assert %{"email" => "recipient2@example.com"} in personalization["to"]
          assert personalization["cc"] == [%{"email" => "cc@example.com"}]
          assert personalization["bcc"] == [%{"email" => "bcc@example.com"}]

          {:ok, 202, [{"x-message-id", "sg.multi.recipients.123"}], ""}
        end do
        assert {:ok, %{id: "sg.multi.recipients.123"}} = BaseMailer.deliver_now(email)
      end
    end
  end

  describe "email delivery" do
    setup do
      # Ensure we're in test environment for these tests
      original_env = Application.get_env(:operately, :app_env)
      Application.put_env(:operately, :app_env, :test)

      on_exit(fn ->
        Application.put_env(:operately, :app_env, original_env)
      end)

      :ok
    end

    test "delivers email with all required fields" do
      email =
        Email.new()
        |> Email.to("recipient@example.com")
        |> Email.from("sender@operately.com")
        |> Email.subject("Complete Email Test")
        |> Email.html_body("<h1>Hello</h1><p>This is a test email.</p>")
        |> Email.text_body("Hello\n\nThis is a test email.")

      assert {:ok, _delivered_email} = BaseMailer.deliver_now(email)

      # Verify the email was properly delivered
      assert_email_sent(
        to: "recipient@example.com",
        from: "sender@operately.com",
        subject: "Complete Email Test"
      )
    end

    test "handles multiple recipients" do
      email =
        Email.new()
        |> Email.to(["user1@example.com", "user2@example.com"])
        |> Email.from("sender@operately.com")
        |> Email.subject("Multiple Recipients Test")
        |> Email.html_body("<p>Hello everyone!</p>")

      assert {:ok, _} = BaseMailer.deliver_now(email)

      # With multiple recipients, Swoosh sends one email with both recipients
      # We should check for the email with multiple recipients
      assert_email_sent(
        subject: "Multiple Recipients Test",
        to: ["user1@example.com", "user2@example.com"]
      )
    end
  end
end
