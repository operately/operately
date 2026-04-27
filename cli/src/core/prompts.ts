import { stdin as defaultInput, stdout as defaultOutput } from "node:process";
import { createInterface, type Interface } from "node:readline";
import { Writable } from "node:stream";

export interface PromptIO {
  input: PromptInput;
  output: PromptOutput;
}

type PromptInput = NodeJS.ReadableStream & {
  isTTY?: boolean;
};

type PromptOutput = NodeJS.WritableStream & {
  isTTY?: boolean;
  columns?: number;
  rows?: number;
};

export class PromptCancelledError extends Error {
  constructor(message = "Prompt cancelled") {
    super(message);
    this.name = "PromptCancelledError";
  }
}

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
  if (!supportsHiddenInput(io)) {
    return askQuestionWithIO(prompt, io);
  }

  const output = io.output;
  const mutedOutput = new MutedOutput(output);
  const rl = createInterface({ input: io.input, output: mutedOutput, terminal: true });

  output.write(`${prompt} (hidden) `);
  mutedOutput.muted = true;

  try {
    const answer = await question(rl, "");
    return answer.trim();
  } finally {
    mutedOutput.muted = false;
    rl.close();
    output.write("\n");
  }
}

function defaultPromptIO(): PromptIO {
  return { input: defaultInput, output: defaultOutput };
}

function supportsHiddenInput(io: PromptIO): boolean {
  return Boolean(io.input.isTTY && io.output.isTTY);
}

function question(rl: Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

class MutedOutput extends Writable {
  public muted = false;
  public readonly isTTY: boolean;
  public readonly columns?: number;
  public readonly rows?: number;

  constructor(private readonly target: NodeJS.WritableStream) {
    super();
    const ttyTarget = target as PromptOutput;
    this.isTTY = Boolean(ttyTarget.isTTY);
    this.columns = ttyTarget.columns;
    this.rows = ttyTarget.rows;
  }

  override _write(
    chunk: string | Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    if (!this.muted) {
      if (typeof chunk === "string") {
        this.target.write(chunk, encoding);
      } else {
        this.target.write(chunk);
      }
    }

    callback();
  }
}
