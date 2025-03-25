import { REQUIRED_FIELDS, Target } from "./types";

export function validateTargets(
  fieldName: string,
  targets: Target[],
  addError: (field: string, message: string) => void,
) {
  targets.forEach((target) => {
    for (let field of REQUIRED_FIELDS) {
      if (!target[field] && target[field] !== 0) {
        addError(fieldName, "Target fields cannot be empty");
      }
    }
  });
}
