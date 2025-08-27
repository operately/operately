#!/usr/bin/env node

/**
 * Script to list GitHub Copilot Agents (AI coding agents running in the background)
 * Requires: gh CLI tool to be installed and authenticated
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

// Color definitions for hacker-themed  // Start with table header (no status at top)
  if (agentDataBuffer.length > 0) {
    // Create the main header content with exact spacing to match data rows
    const headerMain = `${"PR".padEnd(5)} ${"UPDATED".padEnd(12)} ${"CI".padEnd(
      10,
    )} ${"COPILOT".padEnd(9)}  ${"TITLE"}`; // Extra space before TITLE
    const headerMainLength = headerMain.length;st colors = {
  GREEN: "\x1b[0;32m",
  BRIGHT_GREEN: "\x1b[1;32m",
  DARK_GREEN: "\x1b[2;32m",
  CYAN: "\x1b[0;36m",
  BRIGHT_CYAN: "\x1b[1;36m",
  YELLOW: "\x1b[1;33m",
  RED: "\x1b[0;31m",
  BLUE: "\x1b[0;34m",
  MAGENTA: "\x1b[0;35m",
  WHITE: "\x1b[1;37m",
  BRIGHT_WHITE: "\x1b[1;37m",
  GRAY: "\x1b[0;37m",
  DIM: "\x1b[2m",
  BOLD: "\x1b[1m",
  RESET: "\x1b[0m",
};

// Unicode characters for fancy display
const symbols = {
  BLOCK_FULL: "█",
  BLOCK_LIGHT: "░",
  BLOCK_MEDIUM: "▒",
  BLOCK_DARK: "▓",
  ARROW_RIGHT: "▶",
  BULLET: "●",
  CHECK: "✓",
  CROSS: "✗",
};

// Global variables for content buffering and state management
let agentDataBuffer = [];
let lastUpdate = "";
let lastTermWidth = 0;
let lastTermHeight = 0;
let renderedBuffer = "";
let dataRefreshCounter = 0;
let currentCountdown = 10;
let resizeTimeout = null;

// Function to immediately re-render on terminal resize (like htop) with debouncing
function handleResize() {
  // Clear any existing resize timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  // Debounce rapid resize events
  resizeTimeout = setTimeout(() => {
    const newWidth = getTerminalWidth();
    const newHeight = getTerminalHeight();

    if (newWidth !== lastTermWidth || newHeight !== lastTermHeight) {
      lastTermWidth = newWidth;
      lastTermHeight = newHeight;
      renderedBuffer = renderDisplay(currentCountdown);
      clearScreen();
      process.stdout.write(renderedBuffer);

      // Add the status line at the bottom
      const statusLine = `${colors.DIM}Press Ctrl+C to exit │ Next refresh in ${currentCountdown} seconds │ Last update: ${lastUpdate}${colors.RESET}`;
      process.stdout.write(`\x1b[${newHeight};1H${statusLine}`);
    }
  }, 16); // ~60fps debouncing for smooth resize
}

// Function to get terminal width
function getTerminalWidth() {
  return process.stdout.columns || 120;
}

// Function to get terminal height
function getTerminalHeight() {
  return process.stdout.rows || 30;
}

// Function to calculate days ago
function daysAgo(dateStr) {
  const dateSeconds = new Date(dateStr).getTime() / 1000;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const diffSeconds = nowSeconds - dateSeconds;
  const days = Math.floor(diffSeconds / 86400);

  if (days === 0) {
    return "TODAY";
  } else if (days === 1) {
    return "1 DAY AGO";
  } else {
    return `${days} DAYS AGO`;
  }
}

// Function to get Copilot status for a specific PR
async function getCopilotStatus(prNumber) {
  try {
    // Get PR assignees and update time
    const { stdout } = await execAsync(
      `gh pr view ${prNumber} --json assignees,updatedAt --jq '{assignees: [.assignees[]?.login], updatedAt: .updatedAt}'`,
    );

    if (!stdout.trim()) {
      return "UNKNOWN";
    }

    const data = JSON.parse(stdout.trim());
    const assignees = data.assignees || [];
    const updatedAt = new Date(data.updatedAt);
    const now = new Date();
    const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);

    // Check if Copilot is assigned
    const copilotAssigned = assignees.includes("Copilot") || assignees.includes("copilot");

    if (copilotAssigned) {
      // If Copilot is assigned and recently updated (within 2 hours), it's working
      if (hoursSinceUpdate < 2) {
        return "WORKING";
      } else if (hoursSinceUpdate < 12) {
        return "ACTIVE";
      } else {
        return "IDLE";
      }
    } else {
      // No Copilot assignment
      if (hoursSinceUpdate < 24) {
        return "RECENT";
      } else {
        return "STALE";
      }
    }
  } catch (error) {
    return "UNKNOWN";
  }
}
async function getCiStatus(prNumber) {
  try {
    const { stdout } = await execAsync(
      `gh pr view ${prNumber} --json statusCheckRollup --jq '.statusCheckRollup[] | .state // .conclusion // "UNKNOWN"'`,
    );
    const checks = stdout
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);

    // Check for any failures first
    if (checks.some((check) => check.includes("FAILURE") || check.includes("FAILED"))) {
      return "FAILURE";
    }

    // Check for any pending/in-progress
    if (checks.some((check) => check.includes("PENDING") || check.includes("IN_PROGRESS"))) {
      return "PENDING";
    }

    // Check if all are successful
    if (
      checks.some((check) => check.includes("SUCCESS") || check.includes("SUCCESSFUL")) &&
      !checks.some((check) => check.includes("UNKNOWN"))
    ) {
      return "SUCCESS";
    }

    // Default to unknown
    return "UNKNOWN";
  } catch (error) {
    return "UNKNOWN";
  }
}

// Function to remove ANSI codes for length calculation
function stripAnsiCodes(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

// Function to render agent row with current terminal width
function renderAgentRow(prNumber, title, author, created, daysAgoStr, updatedDays, ciStatus, copilotStatus, termWidth) {
  // Format CI status with colors
  let formattedCi;
  switch (ciStatus) {
    case "SUCCESS":
      formattedCi = `${colors.GREEN}✓ PASS${colors.RESET}`;
      break;
    case "FAILURE":
      formattedCi = `${colors.RED}✗ FAIL${colors.RESET}`;
      break;
    case "PENDING":
      formattedCi = `${colors.YELLOW}⋯ PEND${colors.RESET}`;
      break;
    case "ERROR":
      formattedCi = `${colors.RED}⚠ ERR${colors.RESET}`;
      break;
    default:
      formattedCi = `${colors.GRAY}? UNK${colors.RESET}`;
  }

  // Format Copilot status with colors
  let formattedCopilot;
  switch (copilotStatus) {
    case "WORKING":
      formattedCopilot = `${colors.GREEN}● WORK${colors.RESET}`;
      break;
    case "ACTIVE":
      formattedCopilot = `${colors.YELLOW}◐ ACTV${colors.RESET}`;
      break;
    case "IDLE":
      formattedCopilot = `${colors.GRAY}○ IDLE${colors.RESET}`;
      break;
    case "RECENT":
      formattedCopilot = `${colors.BLUE}◯ RECV${colors.RESET}`;
      break;
    case "STALE":
      formattedCopilot = `${colors.RED}◯ STAL${colors.RESET}`;
      break;
    default:
      formattedCopilot = `${colors.GRAY}? UNK${colors.RESET}`;
  }

  // Create clickable "Open PR" button
  const prUrl = `https://github.com/operately/operately/pull/${prNumber}`;
  const openPrButton = `\x1b]8;;${prUrl}\x1b\\${colors.BRIGHT_GREEN}[Open PR]${colors.RESET}\x1b]8;;\x1b\\`;

  // Fixed columns width: "#1234 " (6) + "12 DAYS AGO  " (13) + "12 DAYS AGO  " (13) + "✗ FAIL     " (11) + "● WORK     " (10) + extra space (1) = 54
  const fixedWidth = 54;
  const actionWidth = 9; // "[Open PR]"
  const availableTitleWidth = termWidth - fixedWidth - actionWidth - 2; // -2 for safety margin

  // Truncate title to fit available space
  let truncatedTitle = title.substring(0, availableTitleWidth);
  if (title.length > availableTitleWidth) {
    truncatedTitle += "...";
  }

  // Format the main content without action button
  const mainContent = `${colors.BRIGHT_CYAN}#${prNumber.toString().padEnd(4)}${colors.RESET} ${
    colors.YELLOW
  }${daysAgoStr.padEnd(12)}${colors.RESET} ${colors.GRAY}${updatedDays.padEnd(12)}${colors.RESET} ${formattedCi.padEnd(
    10,
  )} ${formattedCopilot.padEnd(9)}  ${colors.BRIGHT_WHITE}${truncatedTitle}${colors.RESET}`; // Extra space before title

  // Calculate the visible length of main content (without ANSI codes)
  const visibleLength = stripAnsiCodes(mainContent).length;

  // Calculate exact padding to right-align the action button
  let padding = termWidth - visibleLength - actionWidth;

  // Ensure we have at least 1 space padding
  if (padding < 1) {
    padding = 1;
  }

  // Output with right-aligned action button
  return mainContent + " ".repeat(padding) + openPrButton;
}

// Function to fetch fresh data from GitHub (heavy operation - do less frequently)
async function fetchAgentData() {
  try {
    // Scan for agents and get their basic info
    const { stdout } = await execAsync(
      `gh pr list --state open --json number,title,author,createdAt,updatedAt --jq '.[] | select(.author.is_bot == true and (.author.login == "app/copilot-swe-agent")) | "\\(.number)|\\(.title)|\\(.author.login)|\\(.createdAt)|\\(.updatedAt)"'`,
    );

    const agentData = stdout
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);

    if (agentData.length > 0 && agentData[0] !== "") {
      // Process each agent and get CI status and Copilot status
      const processedAgents = [];
      for (const line of agentData) {
        const [prNumber, title, author, created, updated] = line.split("|");
        const days = daysAgo(created);
        const updatedDays = daysAgo(updated);

        // Get both CI and Copilot status in parallel
        const [ciStatus, copilotStatus] = await Promise.all([getCiStatus(prNumber), getCopilotStatus(prNumber)]);

        processedAgents.push({
          prNumber,
          title,
          author,
          created,
          updated,
          days,
          updatedDays,
          ciStatus,
          copilotStatus,
        });
      }

      agentDataBuffer = processedAgents;
    } else {
      agentDataBuffer = [];
    }

    lastUpdate = new Date()
      .toLocaleString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  } catch (error) {
    console.error(`${colors.RED}Data fetch error: ${error.message}${colors.RESET}`);
  }
}

// Function to render the complete display with current terminal width
function renderDisplay(countdown) {
  const termWidth = getTerminalWidth();
  const termHeight = getTerminalHeight();
  let output = "";

  // Start with table header (no status at top)
  if (agentDataBuffer.length > 0) {
    // Create the main header content with exact spacing to match data rows
    const headerMain = `${"PR".padEnd(5)} ${"STARTED".padEnd(12)} ${"UPDATED".padEnd(12)} ${"CI".padEnd(
      6,
    )} ${"COPILOT".padEnd(5)} ${"TITLE"}`; // Extra space before TITLE
    const headerMainLength = headerMain.length;

    // Calculate padding to right-align ACTION
    let actionPadding = termWidth - headerMainLength - 6; // 6 is length of "ACTION"
    if (actionPadding < 1) {
      actionPadding = 1;
    }

    // Build the complete header line
    output += `${colors.DIM}${headerMain}${" ".repeat(actionPadding)}ACTION${colors.RESET}\n`;
    output += `${colors.DIM}${"─".repeat(termWidth)}${colors.RESET}\n`;

    // Render each agent row
    for (const agent of agentDataBuffer) {
      output +=
        renderAgentRow(
          agent.prNumber,
          agent.title,
          agent.author,
          agent.created,
          agent.days,
          agent.updatedDays,
          agent.ciStatus,
          agent.copilotStatus,
          termWidth,
        ) + "\n";
    }
  } else {
    output += `${colors.YELLOW}NO ACTIVE AGENTS${colors.RESET}\n`;
    output += `${colors.GRAY}All Copilot agents are currently idle${colors.RESET}\n`;
  }

  // Calculate how many rows we've used
  const outputLines = output.split("\n").length;

  // Fill remaining space but leave room for the status line
  const remainingLines = termHeight - outputLines - 1; // -1 for status line
  if (remainingLines > 0) {
    output += "\n".repeat(remainingLines);
  }

  return output;
}

// Function to handle data refresh with full re-render
function handleDataRefresh() {
  renderedBuffer = renderDisplay(currentCountdown);
  clearScreen();
  process.stdout.write(renderedBuffer);

  // Add the status line at the bottom
  const termHeight = getTerminalHeight();
  const statusLine = `${colors.DIM}Press Ctrl+C to exit │ Next refresh in ${currentCountdown} seconds │ Last update: ${lastUpdate}${colors.RESET}`;
  process.stdout.write(`\x1b[${termHeight};1H${statusLine}`);
}
function fastUpdate(countdown) {
  currentCountdown = countdown; // Store current countdown globally

  // Since resize is handled immediately, we only need to update the status line
  const termHeight = getTerminalHeight();
  const statusLine = `${colors.DIM}Press Ctrl+C to exit │ Next refresh in ${countdown} seconds │ Last update: ${lastUpdate}${colors.RESET}`;

  // Clear the status line first, then write the new one
  process.stdout.write(`\x1b[${termHeight};1H\x1b[K${statusLine}`);
}

// Function to clear screen
function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

// Function to sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// System checks
async function checkPrerequisites() {
  try {
    // Check if gh CLI is installed
    await execAsync("which gh");
  } catch (error) {
    console.error(
      `${colors.RED}${symbols.BLOCK_FULL} CRITICAL ERROR: Install GitHub CLI from https://cli.github.com/${colors.RESET}`,
    );
    process.exit(1);
  }

  try {
    // Check if gh CLI is authenticated
    await execAsync("gh auth status");
  } catch (error) {
    console.error(
      `${colors.RED}${symbols.BLOCK_FULL} ACCESS DENIED: Run 'gh auth login' to authenticate${colors.RESET}`,
    );
    process.exit(1);
  }

  try {
    // Check if we're in a GitHub repository
    const { stdout } = await execAsync("gh repo view --json owner,name -q '.owner.login + \"/\" + .name'");
    if (!stdout.trim()) {
      throw new Error("Not in a repository");
    }
  } catch (error) {
    console.error(
      `${colors.RED}${symbols.BLOCK_FULL} SYSTEM ERROR: Not in a GitHub repository directory${colors.RESET}`,
    );
    process.exit(1);
  }
}

// Main execution
async function main() {
  // Handle Ctrl+C gracefully
  process.on("SIGINT", () => {
    console.log(`\n${colors.GRAY}Monitoring stopped.${colors.RESET}`);
    process.exit(0);
  });

  // Handle terminal resize events - immediate re-render like htop
  process.stdout.on("resize", () => {
    // Immediately re-render on resize for responsive UI
    handleResize();
  });

  // Check prerequisites
  await checkPrerequisites();

  // Initial data fetch
  await fetchAgentData();

  // Initialize terminal tracking
  lastTermWidth = getTerminalWidth();
  lastTermHeight = getTerminalHeight();
  renderedBuffer = renderDisplay(10);
  clearScreen();
  process.stdout.write(renderedBuffer);

  // Add initial status line
  const initialStatusLine = `${colors.DIM}Press Ctrl+C to exit │ Next refresh in 10 seconds │ Last update: ${lastUpdate}${colors.RESET}`;
  process.stdout.write(`\x1b[${lastTermHeight};1H${initialStatusLine}`);

  // Optimized monitoring loop
  while (true) {
    // Fast countdown with potential re-rendering every second
    for (let countdown = 10; countdown >= 1; countdown--) {
      // Check if we need to refresh data (every 10 seconds)
      if (countdown === 10) {
        dataRefreshCounter++;
        if (dataRefreshCounter > 1) {
          // Fetch fresh data from GitHub every 10 seconds
          await fetchAgentData();
          // Trigger full re-render after data refresh
          handleDataRefresh();
          continue; // Skip the fastUpdate since we just did a full render
        }
      }

      // Fast update - only updates status line
      fastUpdate(countdown);

      // Sleep for 1 second
      await sleep(1000);
    }
  }
}

// Start the application
main().catch((error) => {
  console.error(`${colors.RED}Fatal error: ${error.message}${colors.RESET}`);
  process.exit(1);
});
