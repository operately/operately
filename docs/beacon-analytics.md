# Beacon Configuration and Analytics

This document describes the beacon functionality in Operately, which provides
anonymous usage analytics for self-hosted installations.

## Overview

Operately includes a beacon system that collects anonymous usage data from
self-hosted installations to help the development team understand adoption and
usage patterns. The beacon is designed with privacy in mind and can be easily
disabled.

## Beacon Functionality

### What Data is Collected

The beacon collects only minimal, anonymous information:

- **Operately Installation ID**: A randomly generated identifier unique to your
  installation. This ID is used solely for anonymous analytics and cannot be
  traced back to any user, organization, or environment.

- **Operately Version**: The version of Operately running on the installation

### Privacy Considerations

- **No Personal Data**: No user information, company data, or sensitive
  information is collected - **Anonymous**: Installation IDs are generated
  anonymously - **Minimal Data**: Only essential technical information is
  collected - **Easy to Disable**: Can be disabled with a simple environment
  variable

### Default Behavior

- The beacon is **enabled by default** in self-hosted installations - Sends data
  once daily at 2:00 AM UTC - Gracefully handles network failures without
  affecting application functionality - Uses HTTP POST to `http://app.operately.com/analytics/beacons`

### Disabling the Beacon

To disable the beacon in your self-hosted installation, set the environment
variable:

```
OPERATELY_BEACON_ENABLED="false"
```
