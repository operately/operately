# Operately Operator

A terminal dashboard for monitoring GitHub Copilot agents and PR status in the Operately repository. Built with the blessed library for an enhanced terminal user interface.

## Features

- **Real-time monitoring** of GitHub Copilot agents working on PRs
- **CI/CD status tracking** for each PR with color-coded indicators
- **Interactive terminal interface** with keyboard shortcuts
- **Auto-refresh** every 10 seconds with manual refresh option
- **Responsive design** that adapts to terminal resize
- **Clickable PR links** (where supported by terminal)

## Prerequisites

1. **GitHub CLI** - Install from https://cli.github.com/
2. **Node.js** - Version 14.0.0 or higher
3. **Authentication** - Run `gh auth login` to authenticate with GitHub

## Installation

```bash
# From the operator directory
npm install
```

## Usage

```bash
# Start the dashboard
npm start
# or
node main.js
```

## Interface

The dashboard displays:

- **PR Number**: GitHub pull request number
- **Title**: PR title (truncated if too long)
- **Copilot Status**: Current Copilot agent status
  - ✓ DONE (Bright Green) - Work completed
  - ● WORK (Green) - Currently working
  - ◐ ACTV (Yellow) - Recently active
  - ○ IDLE (Gray) - Idle for some time
  - ◯ RECV (Blue) - Recently updated
  - ◯ STAL (Red) - Stale/no recent activity
- **CI Status**: Current CI/CD status with colored indicators
  - ✓ PASS (Green) - All checks passing
  - ✗ FAIL (Red) - Some checks failing
  - ⋯ PEND (Yellow) - Checks in progress
  - ⚠ ERR (Red) - Error in checks
  - ? UNK (Gray) - Unknown status
- **Updated**: Days since last update

## Keyboard Shortcuts

- **q** or **Ctrl+C** - Exit the application
- **r** - Manually refresh data
- **h** or **?** - Show help screen with status indicators
- **↑/↓ arrows** - Navigate through PRs in the table
- **Enter** - Open selected PR in browser (where supported)

## Status Bar

The bottom status bar shows:

- Exit instructions
- Time until next automatic refresh
- Last update timestamp
- Number of active agents

## Technical Details

- **Auto-refresh**: Data refreshes every 10 seconds
- **GitHub API**: Uses GitHub CLI (`gh`) for API access
- **Terminal UI**: Built with blessed library for rich terminal interfaces
- **Cross-platform**: Works on macOS, Linux, and Windows

## Troubleshooting

### Authentication Issues

```bash
gh auth login
```

### Not in Repository

Make sure you're running the script from within the Operately repository directory.

### Terminal Compatibility

The interface works best with modern terminals that support:

- Color output
- Unicode characters
- Terminal resizing
- Mouse interaction (optional)

## Development

The script is structured with:

- **Data fetching**: GitHub API integration via `gh` CLI
- **UI components**: Blessed widgets (screen, table, status bar)
- **Status monitoring**: CI/CD and Copilot status tracking
- **Real-time updates**: Timer-based refresh with countdown

## License

MIT License - Part of the Operately project.
