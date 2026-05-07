import { PromptCancelledError } from "./prompt-errors";
import type { PromptIO } from "./prompts";

export async function readMaskedPassword(prompt: string, io: PromptIO): Promise<string> {
  return new Promise((resolve, reject) => {
    let value = "";
    let isComplete = false;
    let lastRenderedLength = prompt.length + 1;

    const restoreRawMode = () => {
      if (io.input.isTTY && typeof io.input.setRawMode === "function") {
        io.input.setRawMode(false);
      }
    };

    const cleanup = () => {
      restoreRawMode();
      io.input.removeListener("data", onData);
      io.input.removeListener("end", onEnd);
      io.input.removeListener("error", onError);
      io.input.pause?.();
    };

    const finish = (done: () => void) => {
      if (isComplete) return;
      isComplete = true;
      cleanup();
      io.output.write("\n");
      done();
    };

    const render = () => {
      const masked = "*".repeat(Array.from(value).length);
      const text = `${prompt} ${masked}`;
      const padding = Math.max(0, lastRenderedLength - text.length);
      io.output.write(`\r${text}${" ".repeat(padding)}`);
      lastRenderedLength = text.length;
    };

    const removeLastCharacter = () => {
      const chars = Array.from(value);
      chars.pop();
      value = chars.join("");
      render();
    };

    const submit = () => {
      finish(() => resolve(value.trim()));
    };

    const cancel = () => {
      finish(() => reject(new PromptCancelledError()));
    };

    const onEnd = () => {
      cancel();
    };

    const onError = (error: Error) => {
      finish(() => reject(error));
    };

    const onData = (chunk: string | Buffer) => {
      const text = chunk.toString("utf8");

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === "\r") {
          // Carriage return, which some terminals send for Enter.
          if (text[i + 1] === "\n") i++;
          submit();
          return;
        }

        if (char === "\n") {
          // Line feed, which other terminals send for Enter.
          submit();
          return;
        }

        if (char === "\u0003" || char === "\u0004") {
          // Ctrl-C / Ctrl-D: cancel or end-of-input.
          cancel();
          return;
        }

        if (char === "\u0008" || char === "\u007f") {
          // Backspace and DEL are both commonly used for delete.
          removeLastCharacter();
          continue;
        }

        if (char === "\u001b") {
          // Escape starts arrow-key and other terminal control sequences.
          i = skipEscapeSequence(text, i);
          continue;
        }

        if (isPrintableCharacter(char)) {
          value += char;
          render();
        }
      }
    };

    if (io.input.isTTY && typeof io.input.setRawMode === "function") {
      io.input.setRawMode(true);
    }

    io.input.resume?.();
    io.input.on("data", onData);
    io.input.on("end", onEnd);
    io.input.on("error", onError);
    io.output.write(`${prompt} `);
  });
}

function isPrintableCharacter(char: string): boolean {
  // Accept visible characters from space onward, but exclude DEL.
  return char >= " " && char !== "\u007f";
}

function skipEscapeSequence(text: string, startIndex: number): number {
  const next = text[startIndex + 1];

  if (!next) return startIndex;
  if (next !== "[" && next !== "O") return startIndex;

  let index = startIndex + 2;

  while (index < text.length) {
    const char = text[index];
    if ((char >= "A" && char <= "Z") || (char >= "a" && char <= "z") || char === "~") {
      return index;
    }

    index++;
  }

  return text.length - 1;
}
