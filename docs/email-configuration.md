# Email Configuration

Operately supports two email delivery methods: SendGrid and SMTP. This guide explains how to configure each option.

## SendGrid Configuration (Default)

SendGrid is the default email provider. To use SendGrid:

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate an API key in your SendGrid dashboard
3. Set the environment variable:
   ```bash
   SENDGRID_API_KEY=your_api_key_here
   ```

## SMTP Configuration

To use your own SMTP server instead of SendGrid, configure these environment variables:

### Required Variables

- `SMTP_SERVER` - Your SMTP server hostname (e.g., `smtp.gmail.com`, `mail.example.com`)

### Optional Variables

- `SMTP_PORT` - SMTP port number (default: `587`)
- `SMTP_USERNAME` - Username for SMTP authentication
- `SMTP_PASSWORD` - Password for SMTP authentication  
- `SMTP_TLS` - Enable TLS encryption (default: `true`)
- `SMTP_SSL` - Enable SSL encryption (default: `false`)

### Example Configurations

#### Gmail SMTP
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=true
SMTP_SSL=false
```

#### Office 365 SMTP
```bash
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_TLS=true
SMTP_SSL=false
```

#### Custom SMTP Server (SSL)
```bash
SMTP_SERVER=mail.yourdomain.com
SMTP_PORT=465
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_TLS=false
SMTP_SSL=true
```

## How It Works

Operately automatically detects which email method to use:

1. **If `SMTP_SERVER` is set** → Uses SMTP with your configured settings
2. **If `SMTP_SERVER` is not set** → Uses SendGrid with `SENDGRID_API_KEY`

This means you can switch between SendGrid and SMTP by simply setting or unsetting the `SMTP_SERVER` environment variable.

## Security Notes

- Store email credentials securely (e.g., using environment variables, secrets management)
- For Gmail, use app passwords rather than your regular password
- Consider using TLS encryption (`SMTP_TLS=true`) for security
- Test your configuration in a development environment before deploying to production

## Troubleshooting

### Common SMTP Issues

1. **Authentication failures**: Verify username/password and check if the SMTP server requires app passwords
2. **Connection timeouts**: Check firewall rules and ensure the SMTP port is accessible
3. **SSL/TLS errors**: Try different combinations of `SMTP_TLS` and `SMTP_SSL` settings
4. **Port blocked**: Some hosting providers block common email ports (25, 587, 465)

### Testing Your Configuration

You can test email delivery by triggering any Operately feature that sends emails, such as:
- User invitations
- Password reset requests  
- Project notifications
- Weekly digests

Check the Operately logs for email delivery status and any error messages.