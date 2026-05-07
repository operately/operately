export class PromptCancelledError extends Error {
  constructor(message = "Prompt cancelled") {
    super(message);
    this.name = "PromptCancelledError";
  }
}
