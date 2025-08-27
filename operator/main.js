#!/usr/bin/env node

/**
 * Terminal dashboard for monitoring GitHub Copilot Agents and PR status
 * Built with blessed library for enhanced terminal UI
 * Requires: gh CLI tool to be installed and authenticated
 */

const blessed = require("blessed");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

// Unicode characters for display
const symbols = {
  CHECK: "✓",
  CROSS: "✗",
  BULLET: "●",
  PENDING: "⋯",
  WARNING: "⚠",
  UNKNOWN: "?",
  WORKING: "◐",
  IDLE: "○",
  RECENT: "◯",
};

// Global state
let agentDataBuffer = [];
let refreshInterval = 10;
let currentCountdown = refreshInterval;
let screen, table;

// Initialize blessed screen and UI components
function initializeUI() {
  // Create screen
  screen = blessed.screen({
    smartCSR: true,
    title: "Operately Operator - GitHub Copilot Agent Monitor",
  });

  // Create table for displaying PR data
  table = blessed.listtable({
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    mouse: true,
    align: "left",
    noCellBorders: true,
    columnSpacing: 3,
    border: {
      type: "none",
    },
    style: {
      fg: "white",
      header: {
        fg: "bright-white",
        bold: true,
      },
      cell: {
        selected: {
          bg: "blue",
          fg: "white",
        },
      },
    },
    tags: true,
  });

  // Add components to screen
  screen.append(table);

  // Handle key events
  screen.key(["q", "C-c"], () => {
    process.exit(0);
  });

  screen.key(["r"], async () => {
    await fetchAgentData();
    updateDisplay();
    screen.render();
  });

  screen.key(["h", "?"], () => {
    const helpContent = `{bold}{bright-cyan-fg}Operately Operator - Help{/}

{bold}Keyboard Shortcuts:{/}
  q, Ctrl+C  - Exit application
  r          - Refresh data manually
  h, ?       - Show this help
  ↑↓ arrows  - Navigate table
  Enter      - Open selected PR in browser

{bold}Status Indicators:{/}
  CI Status:
    {green-fg}✓ PASS{/} - All checks passing
    {red-fg}✗ FAIL{/} - Some checks failing  
    {yellow-fg}⋯ PEND{/} - Checks in progress
    {red-fg}⚠ ERR{/}  - Error in checks

  Copilot Status:
    {bright-green-fg}✓ DONE{/} - Work completed
    {green-fg}● WORK{/} - Currently working
    {yellow-fg}◐ ACTV{/} - Recently active
    {gray-fg}○ IDLE{/} - Idle for some time

Press any key to continue...`;

    const help = blessed.message({
      parent: screen,
      top: "center",
      left: "center",
      width: 60,
      height: "shrink",
      content: helpContent,
      tags: true,
      border: {
        type: "line",
      },
      style: {
        fg: "white",
        border: {
          fg: "cyan",
        },
      },
    });

    help.on("keypress", () => {
      help.destroy();
      screen.render();
    });

    help.focus();
    screen.render();
  });

  screen.key(["enter"], () => {
    const selected = table.selected;
    if (selected > 0 && agentDataBuffer.length > 0) {
      const agent = agentDataBuffer[selected - 1];
      if (agent) {
        const prUrl = `https://github.com/operately/operately/pull/${agent.prNumber}`;
        exec(`open "${prUrl}"`, (error) => {
          if (error) {
            // Fallback for different systems
            exec(`xdg-open "${prUrl}"`, (error) => {
              if (error) {
                // Show URL in status bar if can't open
                screen.render();
                setTimeout(() => {
                  screen.render();
                }, 3000);
              }
            });
          }
        });
      }
    }
  });

  // Initial render
  screen.render();
}

// Function to calculate days ago
function daysAgo(dateStr) {
  const dateSeconds = new Date(dateStr).getTime() / 1000;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const diffSeconds = nowSeconds - dateSeconds;
  const days = Math.floor(diffSeconds / 86400);

  if (days === 0) {
    return "today";
  } else if (days === 1) {
    return "1 day ago";
  } else {
    return `${days} days ago`;
  }
}

// Function to get Copilot status for a specific PR
async function getCopilotStatus(prNumber) {
  try {
    // Get recent events to check for Copilot work status
    const { stdout } = await execAsync(
      `gh api repos/operately/operately/issues/${prNumber}/events --jq '[.[] | select(.event == "copilot_work_started" or .event == "copilot_work_finished" or .event == "review_requested") | {event: .event, created_at: .created_at, actor: .actor.login}] | sort_by(.created_at) | reverse'`,
    );

    if (!stdout.trim()) {
      return "UNKNOWN";
    }

    const events = JSON.parse(stdout.trim());

    // Check the most recent relevant event
    if (events.length > 0) {
      const latestEvent = events[0];

      // If the most recent event is "copilot_work_finished", Copilot is done
      if (latestEvent.event === "copilot_work_finished") {
        return "DONE";
      }
      // If the most recent event is "review_requested" by Copilot, it's also done
      else if (latestEvent.event === "review_requested" && latestEvent.actor === "Copilot") {
        return "DONE";
      }
      // If the most recent event is "copilot_work_started", Copilot is working
      else if (latestEvent.event === "copilot_work_started") {
        // Check how recent it is to determine if still active
        const eventTime = new Date(latestEvent.created_at);
        const now = new Date();
        const hoursSinceStart = (now - eventTime) / (1000 * 60 * 60);

        if (hoursSinceStart < 4) {
          return "WORKING";
        } else if (hoursSinceStart < 12) {
          return "ACTIVE";
        } else {
          return "IDLE";
        }
      }
    }

    // Fallback to checking assignees if no specific events found
    const assigneeResult = await execAsync(
      `gh pr view ${prNumber} --json assignees,updatedAt --jq '{assignees: [.assignees[]?.login], updatedAt: .updatedAt}'`,
    );

    if (!assigneeResult.stdout.trim()) {
      return "UNKNOWN";
    }

    const data = JSON.parse(assigneeResult.stdout.trim());
    const assignees = data.assignees || [];
    const updatedAt = new Date(data.updatedAt);
    const now = new Date();
    const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);

    // Check if Copilot is assigned
    const copilotAssigned = assignees.includes("Copilot") || assignees.includes("copilot");

    if (copilotAssigned) {
      if (hoursSinceUpdate < 2) {
        return "WORKING";
      } else if (hoursSinceUpdate < 12) {
        return "ACTIVE";
      } else {
        return "IDLE";
      }
    } else {
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

// Format CI status for display
function formatCiStatus(ciStatus) {
  switch (ciStatus) {
    case "SUCCESS":
      return `{green-fg}${symbols.CHECK} PASS{/}`;
    case "FAILURE":
      return `{red-fg}${symbols.CROSS} FAIL{/}`;
    case "PENDING":
      return `{yellow-fg}${symbols.PENDING} PEND{/}`;
    case "ERROR":
      return `{red-fg}${symbols.WARNING} ERR{/}`;
    default:
      return `{gray-fg}${symbols.UNKNOWN} UNK{/}`;
  }
}

// Format Copilot status for display
function formatCopilotStatus(copilotStatus) {
  switch (copilotStatus) {
    case "DONE":
      return `{bright-green-fg}${symbols.CHECK} DONE{/}`;
    case "WORKING":
      return `{green-fg}${symbols.BULLET} WORK{/}`;
    case "ACTIVE":
      return `{yellow-fg}${symbols.WORKING} ACTV{/}`;
    case "IDLE":
      return `{gray-fg}${symbols.IDLE} IDLE{/}`;
    case "RECENT":
      return `{blue-fg}${symbols.RECENT} RECV{/}`;
    case "STALE":
      return `{red-fg}${symbols.RECENT} STAL{/}`;
    default:
      return `{gray-fg}${symbols.UNKNOWN} UNK{/}`;
  }
}

// Update the display with current data
function updateDisplay() {
  if (!table || !screen) return;

  const tableData = [];

  // Add header row
  tableData.push(["{bold}PR{/}", "{bold}TITLE{/}", "{bold}AGENT{/}", "{bold}CI STATUS{/}", "{bold}UPDATED{/}"]);

  // Add agent data
  if (agentDataBuffer.length > 0) {
    agentDataBuffer.forEach((agent) => {
      const row = [
        `{bright-cyan-fg}#${agent.prNumber}{/}`,
        agent.title,
        formatCopilotStatus(agent.copilotStatus),
        formatCiStatus(agent.ciStatus),
        agent.updatedDays,
      ];
      tableData.push(row);
    });
  } else {
    tableData.push(["", `{yellow-fg}NO ACTIVE AGENTS{/}`, "", "", `{gray-fg}All Copilot agents are currently idle{/}`]);
  }

  table.setData(tableData);

  screen.render();
}

// Function to get CI URL from status checks
async function getCiUrl(prNumber) {
  try {
    const { stdout } = await execAsync(
      `gh pr view ${prNumber} --json statusCheckRollup --jq '.statusCheckRollup[] | select(.context and (.context | contains("semaphoreci"))) | .targetUrl'`,
    );

    const url = stdout.trim();
    if (url && url !== "null") {
      return url;
    }

    // Fallback to general Semaphore CI project page
    return "https://operately.semaphoreci.com/projects/operately";
  } catch (error) {
    // Fallback to general Semaphore CI project page
    return "https://operately.semaphoreci.com/projects/operately";
  }
}

// Function to fetch fresh data from GitHub
async function fetchAgentData() {
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

      // Get both CI status and Copilot status in parallel, and also fetch CI URL
      const [ciStatus, copilotStatus, ciUrl] = await Promise.all([
        getCiStatus(prNumber),
        getCopilotStatus(prNumber),
        getCiUrl(prNumber),
      ]);

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
        ciUrl,
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
}

async function main() {
  initializeUI();

  await fetchAgentData();
  updateDisplay();

  setInterval(async () => {
    currentCountdown--;
    if (currentCountdown <= 0) {
      currentCountdown = refreshInterval;
      await fetchAgentData();
      updateDisplay();
    } else {
      screen.render();
    }
  }, 1000);
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
