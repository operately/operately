export interface Company {
  id: string;
  name?: string;
}

export type AuthMethod = "password" | "emailCode" | "google" | "token";
export type CompanyCreationMode = "setup" | "create";
