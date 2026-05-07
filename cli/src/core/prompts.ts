import { stdin as defaultInput, stdout as defaultOutput } from "node:process";
import { createInterface, type Interface } from "node:readline";
import { PromptCancelledError } from "./prompt-errors";
import { readMaskedPassword } from "./password-prompt";

export interface PromptIO {
  input: PromptInput;
  output: PromptOutput;
}

export type PromptInput = NodeJS.ReadableStream & {
  isTTY?: boolean;
  pause?: () => void;
  resume?: () => void;
  setRawMode?: (mode: boolean) => void;
};

export type PromptOutput = NodeJS.WritableStream & {
  write(chunk: string | Uint8Array, cb?: (error?: Error | null) => void): boolean;
};

export { PromptCancelledError } from "./prompt-errors";

export async function askQuestion(prompt: string): Promise<string> {
  return askQuestionWithIO(prompt, defaultPromptIO());
}

export async function askChoice<T>(prompt: string, choices: { label: string; value: T }[]): Promise<T> {
  return askChoiceWithIO(prompt, choices, defaultPromptIO());
}

export async function askPassword(prompt: string): Promise<string> {
  return askPasswordWithIO(prompt, defaultPromptIO());
}

export async function askQuestionWithIO(prompt: string, io: PromptIO): Promise<string> {
  const rl = createInterface({ input: io.input, output: io.output });
  try {
    const answer = await question(rl, `${prompt} `);
    return answer.trim();
  } finally {
    rl.close();
  }
}

export async function askChoiceWithIO<T>(
  prompt: string,
  choices: { label: string; value: T }[],
  io: PromptIO,
): Promise<T> {
  const lines = choices.map((c, i) => `  ${i + 1}. ${c.label}`).join("\n");

  while (true) {
    const rl = createInterface({ input: io.input, output: io.output });

    try {
      const answer = await question(rl, `${prompt}\n${lines}\nEnter choice (1-${choices.length}): `);
      const trimmed = answer.trim();
      const normalized = trimmed.toLowerCase();

      if (normalized === "q" || normalized === "quit" || normalized === "cancel") {
        throw new PromptCancelledError();
      }

      if (/^\d+$/.test(trimmed)) {
        const index = Number.parseInt(trimmed, 10) - 1;
        if (index >= 0 && index < choices.length) {
          return choices[index].value;
        }
      }

      io.output.write(`Invalid choice. Enter a number between 1 and ${choices.length}, or 'q' to cancel.\n`);
    } finally {
      rl.close();
    }
  }
}

export async function askPasswordWithIO(prompt: string, io: PromptIO): Promise<string> {
  return readMaskedPassword(prompt, io);
}

function defaultPromptIO(): PromptIO {
  return { input: defaultInput, output: defaultOutput };
}

function question(rl: Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}
