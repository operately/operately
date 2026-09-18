export interface ClientInstructions {
  id: string;
  name: string;
  /** Short initials shown as a fallback badge (no brand icons are wired up for these clients yet). */
  badge: string;
  steps: string[];
}

/**
 * Short, happy-path connection steps per AI client.
 *
 * Keep these generic ("Settings -> Connectors/MCP -> Add server") rather than pixel-precise
 * menu paths, since each vendor's own settings UI changes over time. The docs page remains
 * the place for anything more detailed (scopes, self-hosting, troubleshooting, other clients).
 */
export const CLIENT_INSTRUCTIONS: ClientInstructions[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    badge: "GPT",
    steps: [
      "In ChatGPT, go to Settings → Connectors → Add custom connector.",
      "Paste the URL above.",
      "Sign in with Operately when prompted and approve access.",
    ],
  },
  {
    id: "claude",
    name: "Claude",
    badge: "CL",
    steps: [
      "In Claude, go to Settings → Connectors → Add custom connector.",
      "Paste the URL above.",
      "Sign in with Operately when prompted and approve access.",
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    badge: "CU",
    steps: [
      "Open Cursor Settings → MCP → Add new server.",
      "Paste the URL above as an HTTP/SSE server.",
      "Sign in with Operately when prompted and approve access.",
    ],
  },
  {
    id: "vscode",
    name: "VS Code",
    badge: "VS",
    steps: [
      "Run \"MCP: Add Server\" from the command palette (or Settings → MCP).",
      "Choose HTTP and paste the URL above.",
      "Sign in with Operately when prompted and approve access.",
    ],
  },
];
