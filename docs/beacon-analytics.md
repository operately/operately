# Beacon Configuration and Analytics

This document describes the beacon functionality in Operately, which provides anonymous usage analytics for self-hosted installations.

## Overview

Operately includes a beacon system that collects anonymous usage data from self-hosted installations to help the development team understand adoption and usage patterns. The beacon is designed with privacy in mind and can be easily disabled.

## Beacon Functionality

### What Data is Collected

The beacon collects only minimal, anonymous information:

- **Operately Version**: The version of Operately running on the installation
- **Operating System**: The operating system type (linux, macos, windows, etc.)
- **Timestamp**: When the beacon was sent

### Privacy Considerations

- **No Personal Data**: No user information, company data, or sensitive information is collected
- **Anonymous**: Installation IDs are generated anonymously based on version and OS only
- **Minimal Data**: Only essential technical information is collected
- **Easy to Disable**: Can be disabled with a simple environment variable

### Default Behavior

- The beacon is **enabled by default** in self-hosted installations
- Sends data once daily at 2:00 AM UTC
- Gracefully handles network failures without affecting application functionality
- Uses HTTP POST to `http://beacons.operately.com`

## Configuration

### Disabling the Beacon

To disable the beacon in your self-hosted installation, set the environment variable:

```bash
OPERATELY_BEACON_ENABLED=false
```

Alternative values that disable the beacon:
- `OPERATELY_BEACON_ENABLED=no`
- `OPERATELY_BEACON_ENABLED=0`

Any other value (or no value) will keep the beacon enabled.

### Docker Compose Example

```yaml
services:
  app:
    environment:
      - OPERATELY_BEACON_ENABLED=false
```

### Environment File Example

```bash
# .env file
OPERATELY_BEACON_ENABLED=false
```

## Beacon Collector (Enterprise Edition)

For Operately Enterprise customers who want to collect their own analytics, the beacon collector component forwards beacon data to PostHog for analysis.

### Setup Requirements

1. **PostHog Account**: Set up a PostHog project
2. **API Key**: Obtain your PostHog API key
3. **Environment Configuration**: Configure the collector

### PostHog Configuration

1. **Create a PostHog Project**:
   - Sign up at [PostHog](https://posthog.com/)
   - Create a new project
   - Note your project API key

2. **Configure API Key**:
   ```bash
   POSTHOG_API_KEY=your_posthog_api_key_here
   ```

3. **Event Structure**: The collector sends events with the following structure:
   ```json
   {
     "event": "self_hosted_beacon",
     "properties": {
       "operately_version": "0.1.0",
       "operating_system": "linux", 
       "beacon_timestamp": "2024-01-01T00:00:00Z",
       "processed_at": "2024-01-01T00:05:00Z"
     },
     "distinct_id": "anonymous_installation_id",
     "timestamp": "2024-01-01T00:00:00Z"
   }
   ```

### PostHog Dashboard Setup

1. **Create Insights**: 
   - Track installation counts over time
   - Monitor version adoption
   - Analyze operating system distribution

2. **Useful Queries**:
   ```sql
   -- Count unique installations
   SELECT count(DISTINCT distinct_id) 
   FROM events 
   WHERE event = 'self_hosted_beacon'
   
   -- Version distribution
   SELECT properties.operately_version, count(DISTINCT distinct_id)
   FROM events 
   WHERE event = 'self_hosted_beacon'
   GROUP BY properties.operately_version
   
   -- Operating system distribution  
   SELECT properties.operating_system, count(DISTINCT distinct_id)
   FROM events
   WHERE event = 'self_hosted_beacon' 
   GROUP BY properties.operating_system
   ```

3. **Recommended Dashboards**:
   - **Installation Overview**: Total installations, active installations, growth over time
   - **Version Adoption**: Version distribution, upgrade patterns
   - **Platform Analysis**: Operating system breakdown, platform trends

### Security Considerations

- **API Key Security**: Keep your PostHog API key secure and rotate regularly
- **Network Security**: Ensure HTTPS is used for PostHog communication
- **Data Retention**: Configure PostHog data retention policies according to your needs
- **Access Control**: Limit access to PostHog dashboards to authorized personnel

## Technical Implementation

### Beacon Cron Job

The beacon runs as an Oban background job scheduled via cron:

```elixir
# Runs daily at 2:00 AM UTC
{"0 2 * * *", Operately.Beacon.Cron}
```

### Error Handling

The beacon system includes comprehensive error handling:

- Network timeouts and failures are logged but don't affect application functionality
- Invalid responses are handled gracefully
- JSON encoding errors are caught and logged
- All errors are logged for debugging but don't interrupt normal operations

### HTTP Configuration

- **Timeout**: 5-second timeout for beacon requests
- **User Agent**: Identifies as Operately beacon
- **Content Type**: JSON (application/json)
- **Method**: HTTP POST

## Troubleshooting

### Common Issues

1. **Beacon Not Sending**:
   - Check `OPERATELY_BEACON_ENABLED` environment variable
   - Verify network connectivity to `beacons.operately.com`
   - Check application logs for errors

2. **PostHog Integration Issues**:
   - Verify `POSTHOG_API_KEY` is set correctly
   - Check PostHog project settings
   - Review network connectivity to PostHog

3. **Data Not Appearing in PostHog**:
   - Verify API key is correct
   - Check event name matches ("self_hosted_beacon")
   - Review PostHog ingestion logs

### Log Messages

Look for these log messages to troubleshoot:

```
# Successful beacon
[debug] Beacon sent successfully: %{...}

# Network errors  
[warning] Failed to send beacon: :timeout

# HTTP errors
[warning] Beacon service returned non-success status: 500

# Configuration errors
[error] PostHog API key not configured
```

### Testing the Beacon

You can manually test the beacon functionality:

```elixir
# In an IEx console
Operately.Beacon.Cron.send_beacon()
```

## Compliance and Legal

### GDPR Compliance

The beacon system is designed to be GDPR compliant:

- **Minimal Data**: Only technical metadata is collected
- **No Personal Data**: No user information is transmitted
- **Easy Opt-out**: Simple environment variable to disable
- **Transparent**: All collected data is documented

### Privacy Policy

Self-hosted installations should inform users about the beacon in their privacy policy, including:

- What data is collected
- How to disable the beacon
- Purpose of data collection
- Data retention policies

## Support

For questions about the beacon system:

1. **Documentation**: Refer to this document first
2. **Community**: Check community forums and discussions
3. **Enterprise Support**: Contact enterprise support for PostHog integration issues
4. **GitHub Issues**: Report bugs or feature requests on GitHub