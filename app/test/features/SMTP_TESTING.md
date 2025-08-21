# SMTP E2E Testing

This directory contains comprehensive end-to-end tests for SMTP email delivery functionality.

## Test Files

### `smtp_email_delivery_test.exs`
- Tests SMTP adapter selection logic
- Verifies configuration parsing from environment variables
- Tests email sending without external dependencies
- Safe to run in any environment

### `smtp_integration_test.exs` 
- Full integration tests that send emails through actual SMTP server
- Requires MailHog SMTP server to be running
- Verifies emails are actually delivered and can be retrieved
- Tagged with `@moduletag :smtp_integration`

## Running the Tests

### Prerequisites

1. **MailHog SMTP Server**: Required for integration tests
   ```bash
   # MailHog is included in docker-compose.yml 
   make dev.up
   ```

2. **Verify MailHog is running**:
   - SMTP server: `127.0.0.1:1025`
   - Web UI: http://127.0.0.1:8025

### Running Tests

```bash
# Run basic SMTP tests (no external dependencies)
mix test test/features/smtp_email_delivery_test.exs

# Run full integration tests (requires MailHog)
mix test test/features/smtp_integration_test.exs

# Run all SMTP-related tests
mix test --grep smtp

# Skip integration tests if MailHog not available
mix test --exclude smtp_integration
```

## Test Coverage

### Basic SMTP Tests
- ✅ SMTP adapter selection when `SMTP_SERVER` is configured
- ✅ SendGrid fallback when SMTP is not configured  
- ✅ Environment variable parsing for various SMTP configurations
- ✅ Email sending without SMTP connection errors

### Integration Tests
- ✅ Password reset emails delivered through SMTP
- ✅ Assignment emails delivered through SMTP  
- ✅ Email content verification through MailHog API
- ✅ Multiple recipient handling

## SMTP Configuration Testing

The tests verify these SMTP configurations work correctly:

```bash
# Gmail SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=user@gmail.com
SMTP_PASSWORD=app-password
SMTP_TLS=true
SMTP_SSL=false

# Office 365 SMTP
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=user@company.com
SMTP_PASSWORD=password
SMTP_TLS=true
SMTP_SSL=false

# Custom SMTP with SSL
SMTP_SERVER=mail.example.com
SMTP_PORT=465
SMTP_USERNAME=noreply@example.com
SMTP_PASSWORD=secret
SMTP_TLS=false
SMTP_SSL=true
```

## Troubleshooting

### MailHog Not Starting
```bash
# Check if MailHog container is running
docker ps | grep mailhog

# Start development environment
make dev.up

# Access MailHog web interface
open http://127.0.0.1:8025
```

### Integration Tests Failing
- Verify MailHog is accessible at `127.0.0.1:8025`
- Check that SMTP port `127.0.0.1:1025` is not blocked
- Ensure no other processes are using these ports

### Test Environment Issues
- Tests temporarily modify Application config
- Tests restore original environment variables after completion
- Use `@moduletag :smtp_integration` to skip integration tests in CI if needed

## CI/CD Integration

For continuous integration:

```bash
# Run basic tests (no external dependencies)
make test.mix

# For full SMTP testing in CI, ensure MailHog is available:
docker-compose up -d mailhog
make test.mix.features
```