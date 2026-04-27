import { describe, it } from "node:test";
import * as assert from "node:assert";
import { PassThrough, Writable } from "node:stream";
import { askChoiceWithIO, askPasswordWithIO } from "../../core/prompts";

class CaptureOutput extends Writable {
  public readonly chunks: string[] = [];
  public readonly isTTY: boolean;
  public readonly columns = 80;
  public readonly rows = 24;

  constructor(isTTY = false) {
    super();
    this.isTTY = isTTY;
  }

  override _write(
    chunk: string | Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.chunks.push(chunk.toString());
    callback();
  }

  text(): string {
    return this.chunks.join("");
  }
}

function createInput(script: string, isTTY = false): NodeJS.ReadableStream {
  const input = new PassThrough() as PassThrough & {
    isTTY?: boolean;
    setRawMode?: (mode: boolean) => void;
  };

  if (isTTY) {
    input.isTTY = true;
    input.setRawMode = () => {};
  }

  queueInputLines(input, script);

  return input;
}

function queueInputLines(input: PassThrough, script: string): void {
  const lines = script.split("\n").filter((line, index, all) => line.length > 0 || index < all.length - 1);

  if (lines.length === 0) {
    setTimeout(() => input.end(), 0);
    return;
  }

  lines.forEach((line, index) => {
    setTimeout(() => {
      input.write(`${line}\n`);
      if (index === lines.length - 1) {
        input.end();
      }
    }, index * 5);
  });
}

describe("prompts", () => {
  it("re-prompts after invalid choice input until a valid option is entered", async () => {
    const output = new CaptureOutput();
    const choice = await askChoiceWithIO(
      "Select one:",
      [
        { label: "One", value: "one" },
        { label: "Two", value: "two" },
      ],
      { input: createInput("9\n2\n"), output },
    );

    assert.strictEqual(choice, "two");
    assert.match(output.text(), /Invalid choice\. Enter a number between 1 and 2, or 'q' to cancel\./);
  });

  it("hides password input on tty-like streams", async () => {
    const output = new CaptureOutput(true);
    const password = await askPasswordWithIO("Password:", {
      input: createInput("secret123\n", true),
      output,
    });

    assert.strictEqual(password, "secret123");
    assert.match(output.text(), /Password: \(hidden\) /);
    assert.doesNotMatch(output.text(), /secret123/);
  });

  it("does not claim hidden input when tty support is unavailable", async () => {
    const output = new CaptureOutput();
    const password = await askPasswordWithIO("Password:", {
      input: createInput("secret123\n"),
      output,
    });

    assert.strictEqual(password, "secret123");
    assert.match(output.text(), /Password: /);
    assert.doesNotMatch(output.text(), /\(hidden\)/);
  });
});
