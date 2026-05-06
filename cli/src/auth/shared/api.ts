import type { ChildProcess } from "child_process";

export const cliAuth = {
  authPassword: "/cli_auth/auth_password",
  startGoogle: "/cli_auth/start_google",
  startGoogleSignup: "/cli_auth/start_google_signup",
  status: "/cli_auth/status",
  createToken: "/cli_auth/create_token",
  checkAccount: "/cli_auth/check_account",
  signup: "/cli_auth/signup",
  createCompany: "/cli_auth/create_company",
  createCompanyOnNonEmpty: "/cli_auth/create_company_on_non_empty",
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
