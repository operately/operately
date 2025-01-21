export function validateEmail(email: string): boolean {
  return email.trim() !== "" && !!email.match(/.+@.+\..+/);
}
