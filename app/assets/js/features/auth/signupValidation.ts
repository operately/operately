import { validatePassword } from "./validatePassword";

// Match Elixir String.trim/1 and its context-independent Unicode lowercase mapping.
export const trimSignupValue = (value: string) => value.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, "");
export const normalizeSignupEmail = (email: string) =>
  Array.from(trimSignupValue(email), (char) => char.toLowerCase()).join("");

export function validSignupEmail(email: string): boolean {
  const normalized = normalizeSignupEmail(email);
  return (
    Array.from(normalized).length <= 255 &&
    /^[^\p{White_Space}@]+@[^\p{White_Space}@.]+(?:\.[^\p{White_Space}@.]+)+$/u.test(normalized)
  );
}

export function validSignupName(name: string): boolean {
  return trimSignupValue(name).length > 0 && Array.from(trimSignupValue(name)).length <= 255;
}

export function signupPasswordFits(password: string): boolean {
  return new TextEncoder().encode(password).length <= 72;
}

export function validSignupPassword(password: string): boolean {
  return validatePassword(password).isValid && signupPasswordFits(password);
}
