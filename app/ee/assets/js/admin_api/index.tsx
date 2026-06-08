import React from "react";
import axios from "axios";
import { handleStaleClientError } from "./staleClient";

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

export type CompanyId = string;

export interface Account {
  id: string;
  fullName: string;
  email: string;
  siteAdmin: boolean;
  companiesCount: number;
  ownedCompaniesCount: number;
  insertedAt: string;
}

export interface Activity {
  id?: string;
  action?: string;
  insertedAt?: string;
}

export interface BillingPlanDefinition {
  id: string;
  key: string;
  displayName: string;
  sortOrder: number;
  memberLimit?: number;
  storageLimitBytes?: number;
}

export interface BillingProduct {
  id: string;
  provider: string;
  planFamily: string;
  billingInterval: string;
  polarProductId: string;
  polarProductName: string;
  priceAmount: number;
  priceCurrency: string;
  version: number;
  active: boolean;
  archivedAt: string;
  lastSyncedAt: string;
  insertedAt: string;
  updatedAt: string;
}

export interface Company {
  id?: string;
  name?: string;
  owners?: Person[];
  peopleCount?: number;
  goalsCount?: number;
  spacesCount?: number;
  projectsCount?: number;
  lastActivityAt?: string;
  insertedAt?: string;
  uuid?: string;
  shortId?: string;
  enabledFeatures?: string[];
}

export interface EmailSettings {
  provider: EmailProvider;
  notificationEmail?: string;
  smtp?: SmtpSettings;
  sendgridApiKeySet?: boolean;
}

export interface Person {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  title: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  ssl: boolean;
  tlsRequired: boolean;
  smtpPasswordSet?: boolean;
}

export type EmailProvider = "smtp" | "sendgrid";

export interface GetAccountsInput {}

export interface GetAccountsResult {
  accounts: Account[];
}

export interface GetActiveCompaniesInput {}

export interface GetActiveCompaniesResult {
  companies: Company[];
}

export interface GetActivitiesInput {
  companyId: CompanyId;
}

export interface GetActivitiesResult {
  activities: Activity[];
}

export interface GetCompaniesInput {}

export interface GetCompaniesResult {
  companies: Company[];
}

export interface GetCompanyInput {
  id: CompanyId;
}

export interface GetCompanyResult {
  company: Company;
}

export interface GetEmailSettingsInput {}

export interface GetEmailSettingsResult {
  emailSettings: EmailSettings;
}

export interface ListBillingPlanDefinitionsInput {}

export interface ListBillingPlanDefinitionsResult {
  planDefinitions: BillingPlanDefinition[];
}

export interface ListBillingProductsInput {}

export interface ListBillingProductsResult {
  products: BillingProduct[];
}

export interface ArchiveBillingProductInput {
  id: string;
}

export interface ArchiveBillingProductResult {
  product: BillingProduct;
}

export interface CreateBillingProductInput {
  planFamily: string;
  billingInterval: string;
  polarProductName: string;
  priceAmount: number;
  priceCurrency?: string;
}

export interface CreateBillingProductResult {
  product: BillingProduct;
}

export interface DeleteAccountInput {
  accountId: string;
}

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
  blockingCompanyNames?: string[];
}

export interface DemoteAccountFromSiteAdminInput {
  accountId: string;
}

export interface DemoteAccountFromSiteAdminResult {
  success: boolean;
  error?: string;
}

export interface EnableFeatureInput {
  companyId: CompanyId;
  feature: string;
}

export interface EnableFeatureResult {
  success: boolean;
}

export interface PromoteAccountToSiteAdminInput {
  accountId: string;
}

export interface PromoteAccountToSiteAdminResult {
  success: boolean;
  error?: string;
}

export interface SendTestEmailInput {
  recipient: string;
  subject: string;
  body: string;
}

export interface SendTestEmailResult {
  success: boolean;
  error?: string;
}

export interface SetActiveBillingProductInput {
  id: string;
}

export interface SetActiveBillingProductResult {
  product: BillingProduct;
}

export interface SyncBillingProductsFromPolarInput {}

export interface SyncBillingProductsFromPolarResult {
  success: boolean;
  syncedCount: number;
}

export interface UpdateBillingPlanDefinitionInput {
  id: string;
  displayName: string;
  sortOrder: number;
  memberLimit?: number | null;
  storageLimitBytes?: number | null;
}

export interface UpdateBillingPlanDefinitionResult {
  planDefinition: BillingPlanDefinition;
}

export interface UpdateBillingProductInput {
  id: string;
  polarProductName?: string;
  priceAmount?: number;
  priceCurrency?: string;
}

export interface UpdateBillingProductResult {
  product: BillingProduct;
}

export interface UpdateEmailSettingsInput {
  provider: EmailProvider;
  notificationEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSsl?: boolean;
  smtpTlsRequired?: boolean;
  sendgridApiKey?: string;
}

export interface UpdateEmailSettingsResult {
  success: boolean;
  error?: string;
  emailSettings?: EmailSettings;
}

class ApiNamespaceRoot {
  constructor(private client: ApiClient) {}

  async getAccounts(input: GetAccountsInput): Promise<GetAccountsResult> {
    return this.client.get("/get_accounts", input);
  }

  async getActiveCompanies(input: GetActiveCompaniesInput): Promise<GetActiveCompaniesResult> {
    return this.client.get("/get_active_companies", input);
  }

  async getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
    return this.client.get("/get_activities", input);
  }

  async getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
    return this.client.get("/get_companies", input);
  }

  async getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
    return this.client.get("/get_company", input);
  }

  async getEmailSettings(input: GetEmailSettingsInput): Promise<GetEmailSettingsResult> {
    return this.client.get("/get_email_settings", input);
  }

  async listBillingPlanDefinitions(input: ListBillingPlanDefinitionsInput): Promise<ListBillingPlanDefinitionsResult> {
    return this.client.get("/list_billing_plan_definitions", input);
  }

  async listBillingProducts(input: ListBillingProductsInput): Promise<ListBillingProductsResult> {
    return this.client.get("/list_billing_products", input);
  }

  async archiveBillingProduct(input: ArchiveBillingProductInput): Promise<ArchiveBillingProductResult> {
    return this.client.post("/archive_billing_product", input);
  }

  async createBillingProduct(input: CreateBillingProductInput): Promise<CreateBillingProductResult> {
    return this.client.post("/create_billing_product", input);
  }

  async deleteAccount(input: DeleteAccountInput): Promise<DeleteAccountResult> {
    return this.client.post("/delete_account", input);
  }

  async demoteAccountFromSiteAdmin(input: DemoteAccountFromSiteAdminInput): Promise<DemoteAccountFromSiteAdminResult> {
    return this.client.post("/demote_account_from_site_admin", input);
  }

  async enableFeature(input: EnableFeatureInput): Promise<EnableFeatureResult> {
    return this.client.post("/enable_feature", input);
  }

  async promoteAccountToSiteAdmin(input: PromoteAccountToSiteAdminInput): Promise<PromoteAccountToSiteAdminResult> {
    return this.client.post("/promote_account_to_site_admin", input);
  }

  async sendTestEmail(input: SendTestEmailInput): Promise<SendTestEmailResult> {
    return this.client.post("/send_test_email", input);
  }

  async setActiveBillingProduct(input: SetActiveBillingProductInput): Promise<SetActiveBillingProductResult> {
    return this.client.post("/set_active_billing_product", input);
  }

  async syncBillingProductsFromPolar(
    input: SyncBillingProductsFromPolarInput,
  ): Promise<SyncBillingProductsFromPolarResult> {
    return this.client.post("/sync_billing_products_from_polar", input);
  }

  async updateBillingPlanDefinition(
    input: UpdateBillingPlanDefinitionInput,
  ): Promise<UpdateBillingPlanDefinitionResult> {
    return this.client.post("/update_billing_plan_definition", input);
  }

  async updateBillingProduct(input: UpdateBillingProductInput): Promise<UpdateBillingProductResult> {
    return this.client.post("/update_billing_product", input);
  }

  async updateEmailSettings(input: UpdateEmailSettingsInput): Promise<UpdateEmailSettingsResult> {
    return this.client.post("/update_email_settings", input);
  }
}

export class ApiClient {
  private basePath: string;
  private headers: any;
  public apiNamespaceRoot: ApiNamespaceRoot;

  constructor() {
    this.apiNamespaceRoot = new ApiNamespaceRoot(this);
  }

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
  async post(path: string, data: any) {
    try {
      const response = await axios.post(this.getBasePath() + path, toSnake(data), { headers: this.getHeaders() });
      return toCamel(response.data);
    } catch (error) {
      handleStaleClientError(error);
      throw error;
    }
  }

  // @ts-ignore
  async get(path: string, params: any) {
    try {
      const response = await axios.get(this.getBasePath() + path, {
        params: toSnake(params),
        headers: this.getHeaders(),
      });
      return toCamel(response.data);
    } catch (error) {
      handleStaleClientError(error);
      throw error;
    }
  }

  getAccounts(input: GetAccountsInput): Promise<GetAccountsResult> {
    return this.apiNamespaceRoot.getAccounts(input);
  }

  getActiveCompanies(input: GetActiveCompaniesInput): Promise<GetActiveCompaniesResult> {
    return this.apiNamespaceRoot.getActiveCompanies(input);
  }

  getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
    return this.apiNamespaceRoot.getActivities(input);
  }

  getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
    return this.apiNamespaceRoot.getCompanies(input);
  }

  getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
    return this.apiNamespaceRoot.getCompany(input);
  }

  getEmailSettings(input: GetEmailSettingsInput): Promise<GetEmailSettingsResult> {
    return this.apiNamespaceRoot.getEmailSettings(input);
  }

  listBillingPlanDefinitions(input: ListBillingPlanDefinitionsInput): Promise<ListBillingPlanDefinitionsResult> {
    return this.apiNamespaceRoot.listBillingPlanDefinitions(input);
  }

  listBillingProducts(input: ListBillingProductsInput): Promise<ListBillingProductsResult> {
    return this.apiNamespaceRoot.listBillingProducts(input);
  }

  archiveBillingProduct(input: ArchiveBillingProductInput): Promise<ArchiveBillingProductResult> {
    return this.apiNamespaceRoot.archiveBillingProduct(input);
  }

  createBillingProduct(input: CreateBillingProductInput): Promise<CreateBillingProductResult> {
    return this.apiNamespaceRoot.createBillingProduct(input);
  }

  deleteAccount(input: DeleteAccountInput): Promise<DeleteAccountResult> {
    return this.apiNamespaceRoot.deleteAccount(input);
  }

  demoteAccountFromSiteAdmin(input: DemoteAccountFromSiteAdminInput): Promise<DemoteAccountFromSiteAdminResult> {
    return this.apiNamespaceRoot.demoteAccountFromSiteAdmin(input);
  }

  enableFeature(input: EnableFeatureInput): Promise<EnableFeatureResult> {
    return this.apiNamespaceRoot.enableFeature(input);
  }

  promoteAccountToSiteAdmin(input: PromoteAccountToSiteAdminInput): Promise<PromoteAccountToSiteAdminResult> {
    return this.apiNamespaceRoot.promoteAccountToSiteAdmin(input);
  }

  sendTestEmail(input: SendTestEmailInput): Promise<SendTestEmailResult> {
    return this.apiNamespaceRoot.sendTestEmail(input);
  }

  setActiveBillingProduct(input: SetActiveBillingProductInput): Promise<SetActiveBillingProductResult> {
    return this.apiNamespaceRoot.setActiveBillingProduct(input);
  }

  syncBillingProductsFromPolar(input: SyncBillingProductsFromPolarInput): Promise<SyncBillingProductsFromPolarResult> {
    return this.apiNamespaceRoot.syncBillingProductsFromPolar(input);
  }

  updateBillingPlanDefinition(input: UpdateBillingPlanDefinitionInput): Promise<UpdateBillingPlanDefinitionResult> {
    return this.apiNamespaceRoot.updateBillingPlanDefinition(input);
  }

  updateBillingProduct(input: UpdateBillingProductInput): Promise<UpdateBillingProductResult> {
    return this.apiNamespaceRoot.updateBillingProduct(input);
  }

  updateEmailSettings(input: UpdateEmailSettingsInput): Promise<UpdateEmailSettingsResult> {
    return this.apiNamespaceRoot.updateEmailSettings(input);
  }
}

const defaultApiClient = new ApiClient();

export async function getAccounts(input: GetAccountsInput): Promise<GetAccountsResult> {
  return defaultApiClient.getAccounts(input);
}
export async function getActiveCompanies(input: GetActiveCompaniesInput): Promise<GetActiveCompaniesResult> {
  return defaultApiClient.getActiveCompanies(input);
}
export async function getActivities(input: GetActivitiesInput): Promise<GetActivitiesResult> {
  return defaultApiClient.getActivities(input);
}
export async function getCompanies(input: GetCompaniesInput): Promise<GetCompaniesResult> {
  return defaultApiClient.getCompanies(input);
}
export async function getCompany(input: GetCompanyInput): Promise<GetCompanyResult> {
  return defaultApiClient.getCompany(input);
}
export async function getEmailSettings(input: GetEmailSettingsInput): Promise<GetEmailSettingsResult> {
  return defaultApiClient.getEmailSettings(input);
}
export async function listBillingPlanDefinitions(
  input: ListBillingPlanDefinitionsInput,
): Promise<ListBillingPlanDefinitionsResult> {
  return defaultApiClient.listBillingPlanDefinitions(input);
}
export async function listBillingProducts(input: ListBillingProductsInput): Promise<ListBillingProductsResult> {
  return defaultApiClient.listBillingProducts(input);
}
export async function archiveBillingProduct(input: ArchiveBillingProductInput): Promise<ArchiveBillingProductResult> {
  return defaultApiClient.archiveBillingProduct(input);
}
export async function createBillingProduct(input: CreateBillingProductInput): Promise<CreateBillingProductResult> {
  return defaultApiClient.createBillingProduct(input);
}
export async function deleteAccount(input: DeleteAccountInput): Promise<DeleteAccountResult> {
  return defaultApiClient.deleteAccount(input);
}
export async function demoteAccountFromSiteAdmin(
  input: DemoteAccountFromSiteAdminInput,
): Promise<DemoteAccountFromSiteAdminResult> {
  return defaultApiClient.demoteAccountFromSiteAdmin(input);
}
export async function enableFeature(input: EnableFeatureInput): Promise<EnableFeatureResult> {
  return defaultApiClient.enableFeature(input);
}
export async function promoteAccountToSiteAdmin(
  input: PromoteAccountToSiteAdminInput,
): Promise<PromoteAccountToSiteAdminResult> {
  return defaultApiClient.promoteAccountToSiteAdmin(input);
}
export async function sendTestEmail(input: SendTestEmailInput): Promise<SendTestEmailResult> {
  return defaultApiClient.sendTestEmail(input);
}
export async function setActiveBillingProduct(
  input: SetActiveBillingProductInput,
): Promise<SetActiveBillingProductResult> {
  return defaultApiClient.setActiveBillingProduct(input);
}
export async function syncBillingProductsFromPolar(
  input: SyncBillingProductsFromPolarInput,
): Promise<SyncBillingProductsFromPolarResult> {
  return defaultApiClient.syncBillingProductsFromPolar(input);
}
export async function updateBillingPlanDefinition(
  input: UpdateBillingPlanDefinitionInput,
): Promise<UpdateBillingPlanDefinitionResult> {
  return defaultApiClient.updateBillingPlanDefinition(input);
}
export async function updateBillingProduct(input: UpdateBillingProductInput): Promise<UpdateBillingProductResult> {
  return defaultApiClient.updateBillingProduct(input);
}
export async function updateEmailSettings(input: UpdateEmailSettingsInput): Promise<UpdateEmailSettingsResult> {
  return defaultApiClient.updateEmailSettings(input);
}

export function useGetAccounts(input: GetAccountsInput): UseQueryHookResult<GetAccountsResult> {
  return useQuery<GetAccountsResult>(() => defaultApiClient.getAccounts(input));
}

export function useGetActiveCompanies(input: GetActiveCompaniesInput): UseQueryHookResult<GetActiveCompaniesResult> {
  return useQuery<GetActiveCompaniesResult>(() => defaultApiClient.getActiveCompanies(input));
}

export function useGetActivities(input: GetActivitiesInput): UseQueryHookResult<GetActivitiesResult> {
  return useQuery<GetActivitiesResult>(() => defaultApiClient.getActivities(input));
}

export function useGetCompanies(input: GetCompaniesInput): UseQueryHookResult<GetCompaniesResult> {
  return useQuery<GetCompaniesResult>(() => defaultApiClient.getCompanies(input));
}

export function useGetCompany(input: GetCompanyInput): UseQueryHookResult<GetCompanyResult> {
  return useQuery<GetCompanyResult>(() => defaultApiClient.getCompany(input));
}

export function useGetEmailSettings(input: GetEmailSettingsInput): UseQueryHookResult<GetEmailSettingsResult> {
  return useQuery<GetEmailSettingsResult>(() => defaultApiClient.getEmailSettings(input));
}

export function useListBillingPlanDefinitions(
  input: ListBillingPlanDefinitionsInput,
): UseQueryHookResult<ListBillingPlanDefinitionsResult> {
  return useQuery<ListBillingPlanDefinitionsResult>(() => defaultApiClient.listBillingPlanDefinitions(input));
}

export function useListBillingProducts(input: ListBillingProductsInput): UseQueryHookResult<ListBillingProductsResult> {
  return useQuery<ListBillingProductsResult>(() => defaultApiClient.listBillingProducts(input));
}

export function useArchiveBillingProduct(): UseMutationHookResult<
  ArchiveBillingProductInput,
  ArchiveBillingProductResult
> {
  return useMutation<ArchiveBillingProductInput, ArchiveBillingProductResult>((input) =>
    defaultApiClient.archiveBillingProduct(input),
  );
}

export function useCreateBillingProduct(): UseMutationHookResult<
  CreateBillingProductInput,
  CreateBillingProductResult
> {
  return useMutation<CreateBillingProductInput, CreateBillingProductResult>((input) =>
    defaultApiClient.createBillingProduct(input),
  );
}

export function useDeleteAccount(): UseMutationHookResult<DeleteAccountInput, DeleteAccountResult> {
  return useMutation<DeleteAccountInput, DeleteAccountResult>((input) => defaultApiClient.deleteAccount(input));
}

export function useDemoteAccountFromSiteAdmin(): UseMutationHookResult<
  DemoteAccountFromSiteAdminInput,
  DemoteAccountFromSiteAdminResult
> {
  return useMutation<DemoteAccountFromSiteAdminInput, DemoteAccountFromSiteAdminResult>((input) =>
    defaultApiClient.demoteAccountFromSiteAdmin(input),
  );
}

export function useEnableFeature(): UseMutationHookResult<EnableFeatureInput, EnableFeatureResult> {
  return useMutation<EnableFeatureInput, EnableFeatureResult>((input) => defaultApiClient.enableFeature(input));
}

export function usePromoteAccountToSiteAdmin(): UseMutationHookResult<
  PromoteAccountToSiteAdminInput,
  PromoteAccountToSiteAdminResult
> {
  return useMutation<PromoteAccountToSiteAdminInput, PromoteAccountToSiteAdminResult>((input) =>
    defaultApiClient.promoteAccountToSiteAdmin(input),
  );
}

export function useSendTestEmail(): UseMutationHookResult<SendTestEmailInput, SendTestEmailResult> {
  return useMutation<SendTestEmailInput, SendTestEmailResult>((input) => defaultApiClient.sendTestEmail(input));
}

export function useSetActiveBillingProduct(): UseMutationHookResult<
  SetActiveBillingProductInput,
  SetActiveBillingProductResult
> {
  return useMutation<SetActiveBillingProductInput, SetActiveBillingProductResult>((input) =>
    defaultApiClient.setActiveBillingProduct(input),
  );
}

export function useSyncBillingProductsFromPolar(): UseMutationHookResult<
  SyncBillingProductsFromPolarInput,
  SyncBillingProductsFromPolarResult
> {
  return useMutation<SyncBillingProductsFromPolarInput, SyncBillingProductsFromPolarResult>((input) =>
    defaultApiClient.syncBillingProductsFromPolar(input),
  );
}

export function useUpdateBillingPlanDefinition(): UseMutationHookResult<
  UpdateBillingPlanDefinitionInput,
  UpdateBillingPlanDefinitionResult
> {
  return useMutation<UpdateBillingPlanDefinitionInput, UpdateBillingPlanDefinitionResult>((input) =>
    defaultApiClient.updateBillingPlanDefinition(input),
  );
}

export function useUpdateBillingProduct(): UseMutationHookResult<
  UpdateBillingProductInput,
  UpdateBillingProductResult
> {
  return useMutation<UpdateBillingProductInput, UpdateBillingProductResult>((input) =>
    defaultApiClient.updateBillingProduct(input),
  );
}

export function useUpdateEmailSettings(): UseMutationHookResult<UpdateEmailSettingsInput, UpdateEmailSettingsResult> {
  return useMutation<UpdateEmailSettingsInput, UpdateEmailSettingsResult>((input) =>
    defaultApiClient.updateEmailSettings(input),
  );
}

export default {
  default: defaultApiClient,

  getAccounts,
  useGetAccounts,
  getActiveCompanies,
  useGetActiveCompanies,
  getActivities,
  useGetActivities,
  getCompanies,
  useGetCompanies,
  getCompany,
  useGetCompany,
  getEmailSettings,
  useGetEmailSettings,
  listBillingPlanDefinitions,
  useListBillingPlanDefinitions,
  listBillingProducts,
  useListBillingProducts,
  archiveBillingProduct,
  useArchiveBillingProduct,
  createBillingProduct,
  useCreateBillingProduct,
  deleteAccount,
  useDeleteAccount,
  demoteAccountFromSiteAdmin,
  useDemoteAccountFromSiteAdmin,
  enableFeature,
  useEnableFeature,
  promoteAccountToSiteAdmin,
  usePromoteAccountToSiteAdmin,
  sendTestEmail,
  useSendTestEmail,
  setActiveBillingProduct,
  useSetActiveBillingProduct,
  syncBillingProductsFromPolar,
  useSyncBillingProductsFromPolar,
  updateBillingPlanDefinition,
  useUpdateBillingPlanDefinition,
  updateBillingProduct,
  useUpdateBillingProduct,
  updateEmailSettings,
  useUpdateEmailSettings,
};
