# SMTP Configuration Guide

This guide provides detailed instructions for setting up SMTP email delivery in Operately with popular email service providers.

## Overview

Operately supports SMTP email delivery through environment variables. This allows you to use any SMTP-compatible email service, including cloud providers, self-hosted mail servers, and development tools.

## Environment Variables

Configure SMTP using the following environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_SERVER` | SMTP server hostname | - | Yes |
| `SMTP_PORT` | SMTP server port | 587 | No |
| `SMTP_USERNAME` | SMTP authentication username | - | Yes* |
| `SMTP_PASSWORD` | SMTP authentication password | - | Yes* |
| `SMTP_SSL` | Use SSL encryption (true/false) | false | No |
| `SMTP_PROVIDER` | Provider name for optimized settings | - | No** |

*Required for authenticated SMTP servers (most production services)

**Optional but recommended for AWS SES to prevent TLS handshake errors

## Popular Email Service Providers

### AWS SES (Amazon Simple Email Service)

AWS SES is a reliable, scalable email service. First, verify your domain or email address in the AWS SES console.

```bash
# Environment variables for AWS SES
SMTP_PROVIDER=aws-ses
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-aws-access-key-id
SMTP_PASSWORD=your-aws-secret-access-key
SMTP_SSL=false
```

**Setup steps:**
1. Sign up for AWS and enable SES
2. Verify your sending domain or email address
3. Create SMTP credentials in the SES console (not IAM access keys)
4. Set `SMTP_PROVIDER=aws-ses` to enable optimized TLS 1.2 configuration
5. Use the SMTP credentials as username/password

**Important Notes:**
- Setting `SMTP_PROVIDER=aws-ses` enables optimized TLS configuration for AWS SES compatibility
- New AWS accounts start in sandbox mode with sending restrictions
- Verify your sender email addresses or domains before sending

**Regional endpoints:**
- US East (N. Virginia): `email-smtp.us-east-1.amazonaws.com`
- US West (Oregon): `email-smtp.us-west-2.amazonaws.com`
- Europe (Ireland): `email-smtp.eu-west-1.amazonaws.com`
- Europe (Frankfurt): `email-smtp.eu-central-1.amazonaws.com`
- Asia Pacific (Sydney): `email-smtp.ap-southeast-2.amazonaws.com`

### Gmail (Google Workspace)

For Gmail or Google Workspace accounts, you'll need to use App Passwords.

```bash
# Environment variables for Gmail
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SSL=false
```

**Setup steps:**
1. Enable 2-factor authentication on your Google account
2. Generate an App Password in your Google Account settings
3. Use your email address as username and the App Password as password

### Microsoft Outlook/Office 365

For Outlook.com or Office 365 accounts:

```bash
# Environment variables for Outlook/Office 365
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_SSL=false
```

**Setup steps:**
1. Ensure SMTP is enabled in your account settings
2. For Office 365, you may need to enable SMTP AUTH
3. Use your email address and account password

### Mailgun

Mailgun is a developer-focused email service:

```bash
# Environment variables for Mailgun
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
SMTP_SSL=false
```

**Setup steps:**
1. Sign up for Mailgun and verify your domain
2. Get your SMTP credentials from the Mailgun dashboard
3. Use the provided postmaster username and password

### Postmark

Postmark specializes in transactional email delivery:

```bash
# Environment variables for Postmark
SMTP_SERVER=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USERNAME=your-server-token
SMTP_PASSWORD=your-server-token
SMTP_SSL=false
```

**Setup steps:**
1. Create a Postmark account and server
2. Get your Server Token from the credentials section
3. Use the server token for both username and password

### SendinBlue (Brevo)

SendinBlue offers email marketing and transactional email services:

```bash
# Environment variables for SendinBlue
SMTP_SERVER=smtp-relay.sendinblue.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-sendinblue-password
SMTP_SSL=false
```

**Setup steps:**
1. Create a SendinBlue account
2. Generate SMTP credentials in your account settings
3. Use your login email and the generated SMTP password

### Mailjet

Mailjet is another popular transactional email provider. It supports SMTP with STARTTLS on ports 587 and 2525.

```bash
# Environment variables for Mailjet
SMTP_PROVIDER=mailjet
SMTP_SERVER=in-v3.mailjet.com
SMTP_PORT=587
SMTP_USERNAME=your-mailjet-api-key
SMTP_PASSWORD=your-mailjet-secret-key
SMTP_SSL=false
```

**Setup steps:**
1. Sign up for Mailjet and create an API key and secret
2. Verify your sending domain or email address in the Mailjet dashboard
3. Use the API key as `SMTP_USERNAME` and the secret key as `SMTP_PASSWORD`
4. Set `SMTP_PROVIDER=mailjet` to enable optimized TLS 1.2 configuration
5. Optionally use port `2525` instead of `587` if your environment blocks 587

**Important Notes:**
- Mailjet requires TLS; with the configuration above (`SMTP_SSL=false` and port 587), STARTTLS will be used automatically

## Development and Testing

### MailHog (Local Development)

MailHog is a great tool for testing email delivery during development without sending real emails.

```bash
# Environment variables for MailHog
SMTP_SERVER=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_SSL=false
E2E_EMAIL_TEST=true
```

**Setup with Docker:**
```bash
# Run MailHog in a separate container
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Or add to your docker-compose.yml
version: '3.8'
services:
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP server
      - "8025:8025"  # Web interface
```

Access the MailHog web interface at `http://localhost:8025` to view sent emails.

### Mailpit (Alternative to MailHog)

Mailpit is a modern alternative to MailHog with better performance:

```bash
# Environment variables for Mailpit
SMTP_SERVER=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_SSL=false
```

**Setup with Docker:**
```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

## SSL/TLS Configuration

### Using SSL (Port 465)

For providers that require SSL on port 465:

```bash
SMTP_SERVER=smtp.example.com
SMTP_PORT=465
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_SSL=true
```

### Using STARTTLS (Port 587)

Most modern providers use STARTTLS on port 587:

```bash
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_SSL=false  # Uses STARTTLS automatically
```

## Configuration in Different Environments

### Docker Compose

Add SMTP configuration to your `docker-compose.yml`:

```yaml
version: '3.8'
services:
  operately:
    environment:
      - SMTP_SERVER=smtp.example.com
      - SMTP_PORT=587
      - SMTP_USERNAME=your-username
      - SMTP_PASSWORD=your-password
      - SMTP_SSL=false
      # For AWS SES, add:
      - SMTP_PROVIDER=aws-ses
```

### Environment File

Create a `.env` file in your project root:

```bash
# SMTP Configuration (Generic)
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_SSL=false

# For AWS SES, add the provider:
SMTP_PROVIDER=aws-ses
```

### Production Deployment

For production, ensure sensitive credentials are stored securely:

```bash
# Use environment variables or secrets management
export SMTP_SERVER="smtp.example.com"
export SMTP_PORT="587"
export SMTP_USERNAME="your-username"
export SMTP_PASSWORD="your-secure-password"
export SMTP_SSL="false"
```

## Troubleshooting

### Common Issues

**Authentication Failed**
- Verify username and password are correct
- Check if the provider requires App Passwords (Gmail, Outlook)
- Ensure 2FA is properly configured

**Connection Timeout**
- Verify the SMTP server hostname and port
- Check firewall settings and network connectivity
- Try different ports (587, 465, 25)

**SSL/TLS Errors**
- For port 465, set `SMTP_SSL=true`
- For port 587, set `SMTP_SSL=false` (uses STARTTLS)
- Check if the provider requires specific SSL settings

**Emails Not Sending**
- Check the application logs for error messages
- Verify the sender email is authorized by your provider
- Ensure your domain/email is verified with the provider

### Testing Configuration

You can test your SMTP configuration using the built-in email features:

1. **Password Reset Email**: Trigger a password reset to test email delivery
2. **Account Verification**: Create an account to test verification emails
3. **Notification Emails**: Enable notifications to test ongoing email delivery

### Debug Mode

For debugging SMTP issues, you can enable verbose logging by checking the application logs. The SMTP adapter will provide detailed error messages for connection and authentication issues.

### Firewall Considerations

Ensure the following ports are open for outbound connections:
- Port 587 (STARTTLS) - Most common
- Port 465 (SSL) - Less common but still used
- Port 25 (Plain SMTP) - Usually blocked by cloud providers

## Security Best Practices

1. **Use App Passwords**: For Gmail and Outlook, use App Passwords instead of account passwords
2. **Secure Storage**: Store SMTP credentials in environment variables or secrets management
3. **Rotate Credentials**: Regularly rotate SMTP passwords and API keys
4. **Monitor Usage**: Monitor email sending volume and watch for abuse
5. **Domain Verification**: Always verify sending domains with your email provider

## Provider-Specific Notes

### AWS SES Configuration
- **Requires** domain or email verification before sending
- New accounts start in sandbox mode (limited sending)
- Need to request production access for full sending
- **Set `SMTP_PROVIDER=aws-ses`** to prevent TLS handshake errors that can occur with default settings

### Gmail Limitations
- Daily sending limits apply
- Requires App Passwords with 2FA enabled
- May not be suitable for high-volume sending

### Office 365 Considerations
- SMTP AUTH may need to be enabled
- Some plans have sending limitations
- Modern authentication may be required

## Getting Help

If you encounter issues with SMTP configuration:

1. Check the [troubleshooting section](#troubleshooting) above
2. Review your email provider's SMTP documentation
3. Check Operately application logs for specific error messages
4. Test with a simple SMTP client to isolate configuration issues

For provider-specific help:
- **AWS SES**: [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- **Gmail**: [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- **Outlook**: [Outlook SMTP Settings](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
- **Mailgun**: [Mailgun SMTP Documentation](https://documentation.mailgun.com/en/latest/user_manual.html#smtp)