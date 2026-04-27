import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export async function askQuestion(prompt: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${prompt} `);
    return answer.trim();
  } finally {
    rl.close();
  }
}

export async function askChoice<T>(prompt: string, choices: { label: string; value: T }[]): Promise<T> {
  const rl = createInterface({ input, output });
  try {
    const lines = choices.map((c, i) => `  ${i + 1}. ${c.label}`).join("\n");
    const answer = await rl.question(`${prompt}\n${lines}\nEnter choice (1-${choices.length}): `);
    const index = parseInt(answer.trim(), 10) - 1;
    if (index >= 0 && index < choices.length) {
      return choices[index].value;
    }
    throw new Error("Invalid choice");
  } finally {
    rl.close();
  }
}

export async function askPassword(prompt: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${prompt} (hidden): `);
    return answer.trim();
  } finally {
    rl.close();
  }
}
