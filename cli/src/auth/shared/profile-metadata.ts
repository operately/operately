import { callEndpoint } from "../../core/http";
import type { EndpointRegistry } from "../../commands/registry";

interface ProfileMetadataInput {
  registry: EndpointRegistry;
  callEndpoint: typeof callEndpoint;
  baseUrl: string;
  token: string;
  timeoutMs: number;
  fallbackCompanyName?: string;
}

interface GetMePayload {
  me?: {
    full_name?: string;
    email?: string;
  };
}

interface GetCompanyPayload {
  company?: {
    name?: string;
  };
}

export async function fetchProfileMetadata(input: ProfileMetadataInput): Promise<{
  name?: string;
  companyName?: string;
}> {
  const name = await fetchName(input);
  const companyName = input.fallbackCompanyName || (await fetchCompanyName(input));

  return { name, companyName };
}

async function fetchName(input: ProfileMetadataInput): Promise<string | undefined> {
  const getMe = input.registry.find(["people", "get_me"]);
  if (!getMe) return undefined;

  const payload = (await input.callEndpoint({
    endpoint: getMe,
    baseUrl: input.baseUrl,
    token: input.token,
    inputs: {},
    timeoutMs: input.timeoutMs,
    verbose: false,
  })) as GetMePayload;

  return payload.me?.full_name || payload.me?.email;
}

async function fetchCompanyName(input: ProfileMetadataInput): Promise<string | undefined> {
  const getCompany = input.registry.find(["companies", "get"]);
  if (!getCompany) return undefined;

  try {
    const payload = (await input.callEndpoint({
      endpoint: getCompany,
      baseUrl: input.baseUrl,
      token: input.token,
      inputs: {},
      timeoutMs: input.timeoutMs,
      verbose: false,
    })) as GetCompanyPayload;

    return payload.company?.name;
  } catch {
    return undefined;
  }
}
