import { validatePassword } from "@/features/auth/validatePassword";

interface EmailPasswordValidation {
  email: boolean;
  name: boolean;
  password: boolean;
  confirmPassword: boolean;
  isValid: boolean;
}

export function validateEmailPassword(form: any): EmailPasswordValidation {
  const email = form.values.email.trim() !== "" && form.values.email.match(/.+@.+\..+/);
  const name = form.values.name.trim() !== "";
  const password = validatePassword(form.values.password).isValid;
  const confirmPassword = password && form.values.password === form.values.confirmPassword;

  const isValid = email && name && password && confirmPassword;

  return { email, name, password, confirmPassword, isValid };
}
