import { AUTH_ACTIONS, UsageError, type ParsedCommand, type AuthAction } from "./parser-types";
import { parseFlags } from "./flags";

export function parseAuthCommand(argv: string[]): ParsedCommand {
  const action = argv[1];

  if (!action) {
    throw new UsageError("Missing auth command. Use: auth <login|signup|status|whoami|logout>");
  }

  if (!AUTH_ACTIONS.includes(action as AuthAction)) {
    throw new UsageError("Invalid auth command. Use: auth <login|signup|join|status|whoami|logout>");
  }

  const flags = parseFlags(argv.slice(2));
  return { kind: "auth", action: action as AuthAction, flags };
}

export function splitCommandAndFlagTokens(argv: string[]): { commandParts: string[]; flagTokens: string[] } {
  const firstFlagIndex = argv.findIndex((arg) => arg.startsWith("--"));
  if (firstFlagIndex === -1) return { commandParts: argv, flagTokens: [] };

  return {
    commandParts: argv.slice(0, firstFlagIndex),
    flagTokens: argv.slice(firstFlagIndex),
  };
}
