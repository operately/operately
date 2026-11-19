import type { TemplateValidationError } from "../types";

export class ValidationFailure extends Error {
  constructor(public errors: TemplateValidationError[]) {
    super("Template validation failed");
  }
}
