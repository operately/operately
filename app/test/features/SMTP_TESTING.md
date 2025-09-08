# SMTP End-to-End Testing

This test file provides comprehensive end-to-end verification of SMTP email delivery functionality in Operately.

## Purpose

The `smtp_email_delivery_test.exs` file tests that:

1. **Real SMTP emails are sent** - Not just mocked or stubbed, but actual SMTP delivery
2. **SMTP configuration works correctly** - Environment variables are properly detected and used
3. **Email content is delivered** - Recipients receive emails with correct subjects and content
4. **SMTP is preferred over SendGrid** - When SMTP is configured, it takes precedence

## Prerequisites

### MailHog SMTP Server
Tests require MailHog to be running for SMTP testing:

```bash
# Start MailHog with the development environment
make dev.up

# Or start just MailHog
./devenv up -d mailhog
```

MailHog provides:
- **SMTP server** on port 1025 (for sending emails)
- **Web UI** on port 8025 (for viewing received emails)

### Verify MailHog is Running

```bash
# Check SMTP port
curl -s http://127.0.0.1:8025/api/v2/messages

# Check web interface (optional)
open http://127.0.0.1:8025
```

## Running the Tests

### Run SMTP E2E Tests Only
```bash
./devenv bash -c "cd app && mix test test/features/smtp_email_delivery_test.exs"
```

### Run with Specific Tags
```bash
# Run all SMTP end-to-end tests
./devenv bash -c "cd app && mix test --only smtp_e2e"

# Skip SMTP tests if MailHog is not available
./devenv bash -c "cd app && mix test --exclude smtp_e2e"
```

## Test Coverage

### 1. Password Reset Email Delivery
- Sends actual password reset email via SMTP
- Verifies email arrives in MailHog inbox
- Validates subject line contains "reset"
- Confirms email body contains the reset token

### 2. Assignment Email Delivery  
- Creates project with overdue check-in
- Sends assignment email to project champion
- Verifies email delivery through SMTP
- Validates subject mentions assignments

### 3. SMTP Configuration Validation
- Confirms SMTP environment variables are detected
- Verifies SendGrid is disabled when SMTP is configured
- Tests that emails are successfully delivered via SMTP

## How It Works

### Environment Configuration
Tests temporarily modify environment variables:
```elixir
System.put_env("SMTP_SERVER", "127.0.0.1")
System.put_env("SMTP_PORT", "1025")
System.put_env("SMTP_USERNAME", "")
System.put_env("SMTP_PASSWORD", "")
System.put_env("SMTP_SSL", "false")
System.delete_env("SENDGRID_API_KEY")
```

### MailHog Integration
- **SMTP Delivery**: Emails are sent to MailHog's SMTP server (port 1025)
- **Verification**: Tests query MailHog's REST API (port 8025) to verify delivery
- **Content Validation**: Tests examine email headers, subjects, and body content

### Test Isolation
- Original environment variables are restored after each test
- MailHog inbox is cleared before each test
- Tests are tagged with `@moduletag :smtp_e2e` for easy filtering

## Troubleshooting

### MailHog Not Available
If MailHog is not running:
- Tests are automatically skipped
- Use `ExUnit.configure(exclude: [:smtp_e2e])` to skip manually

### SMTP Connection Issues
Common problems:
- **Port blocked**: Ensure port 1025 is available
- **MailHog not started**: Run `./devenv up -d mailhog`
- **Network issues**: Check that 127.0.0.1:1025 is accessible

### Test Failures
If tests fail:
1. Verify MailHog is running: `curl http://127.0.0.1:8025/api/v2/messages`
2. Check SMTP port: `nc -z 127.0.0.1 1025`
3. Review test output for specific error messages
4. Check MailHog web UI for received emails: http://127.0.0.1:8025

## Integration with CI/CD

For continuous integration environments:
```bash
# Start MailHog in CI
./devenv up -d mailhog

# Run all tests including SMTP
make test.mix.features

# Or run only SMTP tests
./devenv bash -c "cd app && mix test --only smtp_e2e"
```

The tests are designed to be robust and will automatically skip if MailHog is not available, making them safe for CI environments where SMTP testing may not be needed.