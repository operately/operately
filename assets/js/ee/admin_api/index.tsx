import React from "react";
import axios from "axios";

function toCamel(o: any) {
  var newO: any, origKey: any, newKey: any, value: any;

  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = toCamel(value);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (o.hasOwnProperty(origKey) && typeof o[origKey] !== "undefined") {
        newKey = origKey.replace(/_([a-z])/g, function (_a: string, b: string) {
          return b.toUpperCase();
        });
        value = o[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toCamel(value);
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}

function toSnake(o: any) {
  var newO: any, origKey: any, newKey: any, value: any;

  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = toSnake(value);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (o.hasOwnProperty(origKey) && typeof o[origKey] !== "undefined") {
        newKey = origKey.replace(/([A-Z])/g, function (a: string) {
          return "_" + a.toLowerCase();
        });
        value = o[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toSnake(value);
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}

type UseQueryHookResult<ResultT> = { data: ResultT | null; loading: boolean; error: Error | null; refetch: () => void };

export function useQuery<ResultT>(fn: () => Promise<ResultT>): UseQueryHookResult<ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(() => {
    setError(null);

    fn()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => fetchData(), []);

  const refetch = React.useCallback(() => {
    setLoading(true);
    fetchData();
  }, []);

  return { data, loading, error, refetch };
}

type UseMutationHookResult<InputT, ResultT> = [
  (input: InputT) => Promise<ResultT | any>,
  { data: ResultT | null; loading: boolean; error: Error | null },
];

export function useMutation<InputT, ResultT>(
  fn: (input: InputT) => Promise<ResultT>,
): UseMutationHookResult<InputT, ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (input: InputT): Promise<ResultT | any> => {
    try {
      setLoading(true);
      setError(null);

      var data = await fn(input);

      setData(data);

      return data;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return [execute, { data, loading, error }];
}

export interface Company {
  id?: string | null;
  name?: string | null;
  owners?: Person[] | null;
  peopleCount?: number | null;
  goalsCount?: number | null;
  spacesCount?: number | null;
  projectsCount?: number | null;
  lastActivityAt?: string | null;
}

export interface Person {
  id?: string | null;
  fullName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface GetCompaniesInput {}

export interface GetCompaniesResult {
  companies?: Company[] | null;
}

export interface GetCompanyInput {
  id?: CompanyId | null;
}

export interface GetCompanyResult {
  company?: Company | null;
}

export class ApiClient {
  private basePath: string;
  private headers: any;

  setBasePath(basePath: string) {
    this.basePath = basePath;
  }

  getBasePath() {
    if (!this.basePath) throw new Error("ApiClient is not configured");
    return this.basePath;
  }

  setHeaders(headers: any) {
    this.headers = headers;
  }

  getHeaders() {
    return this.headers || {};
  }

  // @ts-ignore
  private async post(path: string, data: any) {
    const response = await axios.post(this.getBasePath() + path, toSnake(data), { headers: this.getHeaders() });
    return toCamel(response.data);
  }

  // @ts-ignore
  private async get(path: string, params: any) {
    const response = await axios.get(this.getBasePath() + path, {
      params: toSnake(params),
      headers: this.getHeaders(),
    });
    return toCamel(response.data);
  }

  async getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
    return this.get("/get_companies", input);
  }

  async getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
    return this.get("/get_company", input);
  }
}

const defaultApiClient = new ApiClient();

export async function getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
  return defaultApiClient.getCompanies(input);
}
export async function getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
  return defaultApiClient.getCompany(input);
}

export function useGetCompanies(input: GetCompaniesInput): UseQueryHookResult<GetCompaniesResult> {
  return useQuery<GetCompaniesResult>(() => defaultApiClient.getCompanies(input));
}

export function useGetCompany(input: GetCompanyInput): UseQueryHookResult<GetCompanyResult> {
  return useQuery<GetCompanyResult>(() => defaultApiClient.getCompany(input));
}

export default {
  default: defaultApiClient,

  getCompanies,
  useGetCompanies,
  getCompany,
  useGetCompany,
};
