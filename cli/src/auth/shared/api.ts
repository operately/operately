import type { ChildProcess } from "child_process";

export const cliAuth = {
  authPassword: "/cli_auth/auth_password",
  requestEmailCode: "/cli_auth/request_email_code",
  authEmailCode: "/cli_auth/auth_email_code",
  startGoogle: "/cli_auth/start_google",
  startGoogleSignup: "/cli_auth/start_google_signup",
  status: "/cli_auth/status",
  companyCreationStatus: "/cli_auth/company_creation_status",
  createToken: "/cli_auth/create_token",
  checkAccount: "/cli_auth/check_account",
  signup: "/cli_auth/signup",
  setupCompany: "/cli_auth/setup_company",
  createCompany: "/cli_auth/create_company",
  joinCompany: "/cli_auth/join_company",
  joinWithInvite: "/cli_auth/join_with_invite",
};

export const publicQuery = {
  getInviteLinkByToken: "/invitations/get_invite_link_by_token",
};

export async function openExternalUrl(url: string): Promise<ChildProcess | boolean | undefined> {
  const openModule = (await importModule("open")) as {
    default: (target: string) => Promise<ChildProcess | boolean | undefined>;
  };

  return openModule.default(url);
}

const importModule = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<unknown>;
